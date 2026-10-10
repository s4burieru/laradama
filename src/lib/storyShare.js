/**
 * Story sharing — gets the rendered 1080x1920 PNG (or the story MP4) onto an
 * Instagram or Facebook Story.
 *
 * Two separate paths, never bundled on mobile:
 *
 *   • `shareStoryFile` — Web Share Level 2 only (`navigator.share({ files })`),
 *     the one API that can push a file into the native share sheet from a web
 *     page (mobile browsers are the only place it exists). The blob goes
 *     straight from memory to the sheet — nothing touches Downloads. A sheet
 *     that refuses to open reports `failed` rather than silently saving a file
 *     the user never asked for; the caller points at the Download buttons.
 *   • `saveAndOpenStoryFile` — the explicit desktop/sheet-less fallback: save
 *     the file, then open the platform (phone URL scheme first, website as
 *     backstop). The button that calls it says "Save …" in its label.
 *
 * `downloadStoryFile` is the plain save: it opens nothing at all.
 */

const PLATFORMS = {
  Instagram: {
    slug: 'instagram',
    app: 'instagram://story-camera',
    web: 'https://www.instagram.com/',
  },
  Facebook: {
    slug: 'facebook',
    app: 'fb://facewebmodal/f?href=https%3A%2F%2Fwww.facebook.com%2F',
    web: 'https://www.facebook.com/',
  },
};

const platformOf = (name) => PLATFORMS[name] || PLATFORMS.Instagram;

export const isTouchDevice = () =>
  typeof window !== 'undefined' &&
  ((typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches) ||
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || ''));

/** 'video/mp4' -> 'mp4', 'image/png' -> 'png' — what the file name ends in. */
const extOf = (blob) => {
  const mime = String(blob?.type || '');
  if (mime.includes('/')) return mime.split('/')[1].replace('x-', '') || 'png';
  return 'png';
};

export const storyFileName = (platform = 'Instagram', ext = 'png') =>
  `laradama-${platformOf(platform).slug}-story.${ext}`;

/**
 * Can this browser push a file into a native share sheet at all? Called once
 * to pick the primary button's label — on desktop it reads "Save & open …"
 * instead of a "Post to Story" that would never reach either app.
 *
 * `canShare` is the authoritative answer when it exists; engines that ship
 * `share` but not `canShare` get the benefit of the doubt (a failed
 * `share({files})` still falls through to the download path).
 */
function shareFilesSupport() {
  if (typeof navigator === 'undefined' || typeof navigator.share !== 'function') return false;
  // Desktop share sheets (Windows/macOS) have no Instagram or Facebook story
  // target in them, so reaching for one would be worse than the save-and-open
  // path — only touch-first browsers get the native sheet.
  if (!isTouchDevice()) return false;
  if (typeof navigator.canShare !== 'function') return true;
  if (typeof File !== 'function' || typeof Blob !== 'function') return false;
  try {
    const probe = new File([new Blob(['x'], { type: 'image/png' })], 'probe.png', { type: 'image/png' });
    return navigator.canShare({ files: [probe] });
  } catch {
    return false;
  }
}

export function canShareFiles() {
  try {
    return shareFilesSupport();
  } catch {
    return false;
  }
}

/** Save a blob to disk (object URL + anchor click; Safari needs the DOM node). */
export function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  // keep the node attached briefly: some engines want the anchor alive until
  // the download has actually been handed off
  setTimeout(() => a.remove(), 1000);
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}

function savedHint(platform, name) {
  // Ctrl+J is the fastest way to find the file when the folder isn't where
  // the user expected (Downloads is often redirected, e.g. into Documents).
  const where = isTouchDevice() ? 'your downloads' : 'your Downloads folder (Ctrl+J)';
  return `Saved ${name} to ${where} — open ${platform}, start a Story and add it.`;
}

/**
 * Desktop/unsupported fallback for "open the app": on phones try the URL
 * scheme first and only fall through to the website when the page never loses
 * focus (a blur/visibilitychange means the app took over). Desktop skips the
 * scheme entirely — an unregistered protocol only pops an error dialog there.
 */
function openPlatform(platform) {
  const info = platformOf(platform);

  // Website fallback: a popup refused by the browser (activation can expire
  // while the Story image renders) would otherwise mean nothing happens, so
  // navigate this tab instead — the file is already on disk by then.
  const openWeb = () => {
    const win = window.open(info.web, '_blank');
    if (win) {
      try {
        win.opener = null;
      } catch {
        /* cross-origin window: opener simply stays as-is */
      }
    } else {
      window.location.assign(info.web);
    }
  };

  if (!isTouchDevice()) {
    // Desktop skips the URL scheme entirely — an unregistered protocol only
    // pops an error dialog there.
    openWeb();
    return;
  }

  let taken = false;
  const cleanup = () => {
    clearTimeout(timer);
    document.removeEventListener('visibilitychange', onHidden);
    window.removeEventListener('blur', onBlur);
  };
  const onHidden = () => {
    if (document.visibilityState !== 'visible') {
      taken = true;
      cleanup();
    }
  };
  const onBlur = () => {
    taken = true;
    cleanup();
  };
  const timer = setTimeout(() => {
    cleanup();
    if (!taken) openWeb();
  }, 1200);
  document.addEventListener('visibilitychange', onHidden);
  window.addEventListener('blur', onBlur);

  try {
    window.location.href = info.app;
  } catch {
    cleanup();
    openWeb();
  }
}

function toFile(blob, name) {
  try {
    return new File([blob], name, { type: blob.type || 'image/png' });
  } catch {
    return blob; // very old engines: some share targets still accept a Blob
  }
}

function shareText(song) {
  const title = song?.title ? `${song.title}` : 'My Laradama story';
  const by = song?.artist ? ` by ${song.artist}` : '';
  return `${title}${by} — matched to my photo by Laradama`;
}

/**
 * Hand the rendered file to the platform through the native share sheet —
 * and nothing else. The file never reaches Downloads on this path: the blob
 * goes from memory straight into the OS sheet, where the user picks Instagram
 * or Facebook. Cancelling the sheet is not a failure; a sheet that will not
 * open (or a browser without one) comes back as `failed` so the caller can
 * point at the Download buttons instead of saving unasked.
 *
 * @param {Blob} blob rendered story (PNG or MP4)
 * @param {{platform?: string, song?: {title: string, artist: string}}} opts
 * @returns {Promise<{phase: 'shared'|'cancelled'|'failed', message: string}>}
 */
export async function shareStoryFile(blob, { platform = 'Instagram', song } = {}) {
  if (!blob?.size) throw new Error('the rendered Story export came back empty');
  if (!shareFilesSupport()) {
    return { phase: 'failed', message: 'This browser has no share sheet.' };
  }
  const file = toFile(blob, storyFileName(platform, extOf(blob)));
  try {
    await navigator.share({ files: [file], title: 'Laradama story', text: shareText(song) });
    return { phase: 'shared', message: `Shared to ${platform}.` };
  } catch (err) {
    if (err?.name === 'AbortError') {
      return {
        phase: 'cancelled',
        message: 'Share cancelled — your Story is ready whenever you want it.',
      };
    }
    // NotAllowedError / SecurityError / a share target that choked: report it
    // and let the user choose a Download button — no silent save.
    console.warn('[story] navigator.share failed:', err);
    return { phase: 'failed', message: 'Could not open the share sheet.' };
  }
}

/**
 * The explicit save-and-open action for browsers with no share sheet
 * (desktop, older mobile): write the file to disk, then open the platform —
 * on phones the app URL scheme first, on desktop the website. The button that
 * calls this says "Save …" in its label, so nothing happens behind the user's
 * back.
 *
 * @returns {Promise<{phase: 'downloaded', message: string}>}
 */
export async function saveAndOpenStoryFile(blob, { platform = 'Instagram' } = {}) {
  if (!blob?.size) throw new Error('the rendered Story export came back empty');
  const name = storyFileName(platform, extOf(blob));
  downloadBlob(toFile(blob, name), name);
  openPlatform(platform);
  return { phase: 'downloaded', message: savedHint(platform, name) };
}

/**
 * Just the file: used by the modal's Download button, which never opens an
 * app behind the user's back.
 *
 * @returns {Promise<{phase: 'downloaded', message: string}>}
 */
export async function downloadStoryFile(blob, { platform = 'Instagram' } = {}) {
  if (!blob?.size) throw new Error('the rendered Story export came back empty');
  const name = storyFileName(platform, extOf(blob));
  downloadBlob(toFile(blob, name), name);
  return { phase: 'downloaded', message: savedHint(platform, name) };
}
