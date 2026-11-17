import {
  MANIFEST_URL,
  SPRITES_ROOT,
  characterConfig,
} from '@/config/sprites.config';
import type {
  CharacterSlug,
  ParsedSpriteSheet,
  PropInfo,
  SpriteManifest,
  TileInfo,
} from '@/types/engine.types';
import { parseAlignedMetadata } from './SpriteSheetParser';

function withRoot(path: string): string {
  if (path.startsWith('/')) return path;
  if (path.startsWith('http')) return path;
  return `${SPRITES_ROOT}/${path}`;
}

export class AssetLoader {
  private manifest: SpriteManifest | null = null;
  private manifestPromise: Promise<SpriteManifest> | null = null;
  private imageCache = new Map<string, HTMLImageElement>();
  private imagePromises = new Map<string, Promise<HTMLImageElement>>();
  private sheetCache = new Map<CharacterSlug, ParsedSpriteSheet>();
  private sheetPromises = new Map<CharacterSlug, Promise<ParsedSpriteSheet>>();

  loadManifest(): Promise<SpriteManifest> {
    if (this.manifest) return Promise.resolve(this.manifest);
    if (!this.manifestPromise) {
      this.manifestPromise = fetch(MANIFEST_URL)
        .then((response) => {
          if (!response.ok) throw new Error(`Failed to load sprite manifest (${response.status})`);
          return response.json() as Promise<SpriteManifest>;
        })
        .then((manifest) => {
          this.manifest = manifest;
          return manifest;
        })
        .catch((error) => {
          this.manifestPromise = null;
          throw error;
        });
    }
    return this.manifestPromise;
  }

  getManifest(): SpriteManifest | null {
    return this.manifest;
  }

  loadImage(url: string): Promise<HTMLImageElement> {
    const cached = this.imageCache.get(url);
    if (cached) return Promise.resolve(cached);

    const pending = this.imagePromises.get(url);
    if (pending) return pending;

    const promise = new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.crossOrigin = 'anonymous';
      image.decoding = 'async';
      image.onload = () => {
        this.imageCache.set(url, image);
        this.imagePromises.delete(url);
        resolve(image);
      };
      image.onerror = () => {
        this.imagePromises.delete(url);
        reject(new Error(`Failed to load image: ${url}`));
      };
      image.src = url;
    });

    this.imagePromises.set(url, promise);
    return promise;
  }

  async loadSheet(slug: CharacterSlug): Promise<ParsedSpriteSheet> {
    const cached = this.sheetCache.get(slug);
    if (cached) return cached;

    const pending = this.sheetPromises.get(slug);
    if (pending) return pending;

    const promise = (async () => {
      const config = characterConfig(slug);
      const [image, metadata] = await Promise.all([
        this.loadImage(config.sheet),
        fetch(config.metadata).then((response) => {
          if (!response.ok) throw new Error(`Failed to load metadata for ${slug}`);
          return response.json();
        }),
      ]);
      const sheet = parseAlignedMetadata(metadata, slug, image);
      this.sheetCache.set(slug, sheet);
      this.sheetPromises.delete(slug);
      return sheet;
    })();

    this.sheetPromises.set(slug, promise);
    return promise;
  }

  async preloadCharacters(slugs: CharacterSlug[]): Promise<void> {
    await Promise.all(slugs.map((slug) => this.loadSheet(slug)));
  }

  findTile(name: string): TileInfo | undefined {
    return this.manifest?.tiles.find((tile) => tile.name === name);
  }

  findProp(name: string): PropInfo | undefined {
    return this.manifest?.props.find((prop) => prop.name === name);
  }

  async loadTileImage(name: string): Promise<HTMLImageElement | null> {
    const tile = this.findTile(name);
    if (!tile) return null;
    return this.loadImage(withRoot(tile.file));
  }

  async loadPropImage(name: string): Promise<HTMLImageElement | null> {
    const prop = this.findProp(name);
    if (!prop) return null;
    return this.loadImage(withRoot(prop.file));
  }

  async preloadRoom(props: string[], tiles: string[]): Promise<void> {
    await Promise.all([
      ...props.map((name) => this.loadPropImage(name)),
      ...tiles.map((name) => this.loadTileImage(name)),
    ]);
  }
}
