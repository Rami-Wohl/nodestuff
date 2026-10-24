import { existsSync, lstatSync, mkdtempSync, realpathSync, rmdirSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/**
 * Create a uniquely named directory under the OS temp directory and get back
 * a *guarded* way to remove it again.
 *
 * Deletion rules (LESSON_POLICY.md, "Deleting files and directories"):
 *  - only files registered through `file()` are deleted, each by exact path;
 *  - the directory itself is removed non-recursively, so anything unexpected
 *    inside it makes cleanup fail loudly instead of being deleted;
 *  - before anything is deleted, the directory must still be a real directory
 *    (not a symlink) inside os.tmpdir() whose name starts with the prefix.
 *
 * @param {string} prefix  short, lesson-specific, e.g. 'parse-cost'
 */
export function createTempDir(prefix) {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(prefix)) {
    throw new Error(`temp dir prefix must be lowercase letters, digits and dashes, got "${prefix}"`);
  }
  const root = os.tmpdir();
  const dir = mkdtempSync(path.join(root, `${prefix}-`));
  /** @type {Set<string>} */
  const registered = new Set();

  return {
    /** Absolute path of the directory. */
    dir,

    /**
     * Absolute path for a file inside the directory. Registering a name is
     * what allows `cleanup()` to delete it; nothing unregistered is deleted.
     * @param {string} name  a plain file name, no path separators
     */
    file(name) {
      if (name === '' || name === '.' || name === '..' || name !== path.basename(name)) {
        throw new Error(`temp file name must be a plain file name, got "${name}"`);
      }
      const filePath = path.join(dir, name);
      registered.add(filePath);
      return filePath;
    },

    /**
     * Delete the registered files, then the directory. Safe to call more
     * than once. Throws, deleting nothing further, if the directory holds
     * anything that was not registered.
     */
    cleanup() {
      if (!existsSync(dir)) return;
      assertManagedTempDir(dir, root, prefix);
      for (const filePath of registered) {
        // `force` only tolerates "already gone". Never recursive: if a
        // registered name has become a directory, this throws on purpose.
        rmSync(filePath, { force: true });
      }
      // Non-recursive: fails with ENOTEMPTY if anything unexpected is inside.
      rmdirSync(dir);
    },
  };
}

/**
 * Refuse to touch anything that is not a directory we created ourselves.
 * @param {string} dir @param {string} root @param {string} prefix
 */
function assertManagedTempDir(dir, root, prefix) {
  if (!lstatSync(dir).isDirectory()) {
    throw new Error(`refusing to remove ${dir}: not a directory (a symlink?)`);
  }
  const resolvedRoot = realpathSync(root);
  const resolved = realpathSync(dir);
  if (resolved === resolvedRoot || !resolved.startsWith(resolvedRoot + path.sep)) {
    throw new Error(`refusing to remove ${dir}: not inside the temp directory ${resolvedRoot}`);
  }
  if (!path.basename(resolved).startsWith(`${prefix}-`)) {
    throw new Error(`refusing to remove ${dir}: name does not start with "${prefix}-"`);
  }
}
