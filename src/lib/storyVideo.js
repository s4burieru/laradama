/**
 * Story video export — renders 15 seconds of the animated template with the
 * matched song baked in, as an MP4 (H.264 + AAC) a Story share sheet accepts.
 *
 * Built on Mediabunny: the canvas paints each frame in real time order while
 * `CanvasSource` encodes it through WebCodecs, and the decoded preview audio
 * (trimmed to the clip length) rides an `AudioBufferSource` as the AAC track —
 * no realtime recording, so the whole clip renders in a few seconds on phones
 * with hardware H.264 and the UI stays responsive (the frame loop yields every
 * frame through the encoder's own backpressure).
 *
 * The audio's band levels (storyMotion.levelsForPcm) drive the neon EQ inside
 * the same loop, so the bars dance to the actual track. Songs without a free
 * preview still render — as a silent video (the EQ then bounces to a synthetic
 * stand-in, same as the live preview).
 *
 * Support is detected at runtime (`canExportVideo`): browsers without WebCodecs
 * H.264/AAC encoding (older iOS, desktop Chrome on Windows) simply fall back to
 * the PNG path in the caller — no broken files, no feature guesswork.
 */

import {
  AudioBufferSource,
  BufferTarget,
  CanvasSource,
  Output,
  Quality,
  Mp4OutputFormat,
  getFirstEncodableAudioCodec,
  getFirstEncodableVideoCodec,
} from 'mediabunny';
import { prepareStoryPainter, STORY_W, STORY_H } from './storyImage.js';
import { STORY_DURATION_S, STORY_FPS, levelsForPcm } from './storyMotion.js';

/* ------------------------------------------------------------------ support */

let supportCheck = null;

/**
 * Can this browser encode an Instagram-ready MP4 (H.264 video + AAC audio)?
 * Answered once via Mediabunny's real encoder probes, then memoized.
 */
export function canExportVideo() {
  if (!supportCheck) {
    supportCheck = (async () => {
      try {
        if (typeof VideoEncoder === 'undefined') return false;
        const video = await getFirstEncodableVideoCodec(['avc'], {
          width: STORY_W,
          height: STORY_H,
        });
        const audio = await getFirstEncodableAudioCodec(['aac']);
        return Boolean(video && audio);
      } catch {
        return false;
      }
    })();
  }
  return supportCheck;
}

/* -------------------------------------------------------------------- audio */

/** url -> Promise<AudioBuffer|null> of the clip-length audio (decoded once). */
const audioCache = new Map();

const decoderContext = () =>
  // OfflineAudioContext decodes without the user-gesture restrictions of a
  // realtime AudioContext, and never starts rendering.
  new OfflineAudioContext(1, 1, 44100);

/** Decode `bytes` and trim (never extend) to the clip length. Null on failure. */
async function decodeClip(bytes, durationS = STORY_DURATION_S) {
  try {
    const full = await decoderContext().decodeAudioData(bytes);
    const sr = full.sampleRate;
    const frames = Math.max(1, Math.ceil(Math.min(durationS, full.duration) * sr));
    const clip = new OfflineAudioContext(Math.min(2, full.numberOfChannels), frames, sr);
    const src = clip.createBufferSource();
    src.buffer = full;
    src.connect(clip.destination);
    src.start(0);
    return await clip.startRendering();
  } catch (err) {
    console.warn('[story] audio decode failed, exporting without music:', err);
    return null;
  }
}

/**
 * The clip-length AudioBuffer for a track's preview URL — fetched, decoded and
 * trimmed once per URL (the modal pre-warms it while the user picks a
 * template). Never rejects: a failed fetch/decode means a silent video.
 */
export function prewarmStoryAudio(url) {
  if (!url) return Promise.resolve(null);
  let cached = audioCache.get(url);
  if (!cached) {
    cached = fetch(url, { mode: 'cors' })
      .then((res) => {
        if (!res.ok) throw new Error(`audio fetch ${res.status}`);
        return res.arrayBuffer();
      })
      .then((bytes) => decodeClip(bytes))
      .catch((err) => {
        console.warn('[story] could not load the track for the video export:', err);
        return null;
      });
    audioCache.set(url, cached);
  }
  return cached;
}

/* -------------------------------------------------------------------- video */

const yieldToUi = () => new Promise((resolve) => setTimeout(resolve, 0));

/**
 * Render the story video: 15s of animated template + music, as a video/mp4
 * Blob. Throws when the browser cannot encode; returns a silent video (with a
 * console warning) when the track has no playable preview.
 *
 * @param {object} opts
 * @param {{title: string, artist: string, gradient?: string, audioUrl?: string}} opts.song
 * @param {string} [opts.templateId]
 * @param {string|null} [opts.uploadedImage] data URL of the user's photo
 * @param {(progress: number) => void} [opts.onProgress] 0..1 through the frame loop
 * @returns {Promise<Blob>}
 */
export async function renderStoryVideo({
  song,
  templateId = 'clean',
  uploadedImage = null,
  onProgress,
} = {}) {
  if (!(await canExportVideo())) {
    throw new Error('this browser cannot encode story videos');
  }

  const painter = await prepareStoryPainter({ song, templateId, uploadedImage });
  const { canvas } = painter;

  const audioBuffer = song?.audioUrl ? await prewarmStoryAudio(song.audioUrl) : null;
  if (song?.audioUrl && !audioBuffer) {
    console.warn('[story] no audio decoded — the Story video will be silent');
  }
  const levels = audioBuffer
    ? levelsForPcm(audioBuffer, STORY_DURATION_S, STORY_FPS)
    : null;

  const output = new Output({
    format: new Mp4OutputFormat({ fastStart: 'in-memory' }),
    target: new BufferTarget(),
  });
  const videoSource = new CanvasSource(canvas, {
    codec: 'avc',
    quality: new Quality('high'),
  });
  output.addVideoTrack(videoSource, { frameRate: STORY_FPS });

  let audioSource = null;
  if (audioBuffer) {
    audioSource = new AudioBufferSource({ codec: 'aac', quality: new Quality('high') });
    output.addAudioTrack(audioSource);
  }

  await output.start();

  const total = Math.round(STORY_DURATION_S * STORY_FPS);
  let lastPct = -1;
  for (let i = 0; i < total; i += 1) {
    const t = i / STORY_FPS;
    painter.draw(t, { levels });
    // add() resolves when the encoder has taken the frame — its backpressure
    // is what keeps 450 live VideoFrames from piling up in memory.
    await videoSource.add(t, 1 / STORY_FPS);
    if (onProgress) {
      const pct = Math.floor((i / total) * 100);
      if (pct !== lastPct) {
        lastPct = pct;
        onProgress(i / total);
        await yieldToUi(); // let the progress message paint
      }
    }
  }

  if (audioSource) await audioSource.add(audioBuffer);

  await output.finalize();
  onProgress?.(1);
  return new Blob([output.target.buffer], { type: 'video/mp4' });
}
