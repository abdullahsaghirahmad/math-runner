declare module 'phaser' {
  export = Phaser;
}

declare namespace Phaser {
  namespace Types {
    namespace Core {
      interface Vector2Like {
        x: number;
        y: number;
      }
      interface GameConfig {
        type: number;
        width: number;
        height: number;
        parent: string;
        physics?: {
          default: string;
          arcade?: {
            gravity?: Vector2Like;
            debug?: boolean;
          };
        };
        scene: any[];
      }
    }
    namespace Input {
      namespace Keyboard {
        interface CursorKeys {
          up: { isDown: boolean };
          down: { isDown: boolean };
          left: { isDown: boolean };
          right: { isDown: boolean };
        }
      }
    }
  }
  class Scene {
    load: Loader.LoaderPlugin;
    physics: Physics.Arcade.ArcadePhysics;
    input: Input.InputPlugin;
    add: GameObjects.GameObjectFactory;
    time: Time.Clock;
  }
  namespace GameObjects {
    class GameObjectFactory {
      text(x: number, y: number, text: string, style: any): Text;
      graphics(): Graphics;
    }
    class Text extends GameObject {
      setOrigin(x: number, y?: number): this;
      setText(text: string): this;
    }
    class GameObject {
      setTint(color: number): this;
      destroy(): void;
    }
    class Graphics extends GameObject {
      fillStyle(color: number, alpha?: number): this;
      fillCircle(x: number, y: number, radius: number): this;
      fillRect(x: number, y: number, width: number, height: number): this;
      generateTexture(key: string, width: number, height: number): void;
    }
  }
  namespace Physics {
    namespace Arcade {
      class ArcadePhysics {
        add: {
          sprite(x: number, y: number, texture: string): Sprite;
          group(): Group;
          collider(object1: GameObjectWithBody, object2: GameObjectWithBody, callback?: ArcadePhysicsCallback, processCallback?: ArcadePhysicsCallback, callbackContext?: any): Collider;
          overlap(object1: GameObjectWithBody, object2: GameObjectWithBody, callback?: ArcadePhysicsCallback, processCallback?: ArcadePhysicsCallback, callbackContext?: any): Overlap;
        };
        pause(): void;
      }
      class Sprite extends Phaser.GameObjects.Sprite {
        setCollideWorldBounds(value: boolean): this;
        setVelocityX(value: number): this;
        setVelocityY(value: number): this;
        setBounce(value: number): this;
        destroy(): void;
        setTexture(key: string): this;
      }
      class Group {
        create(x: number, y: number, texture: string): Sprite;
      }
      class Collider {}
      class Overlap {}
      type ArcadePhysicsCallback = (object1: GameObjectWithBody | Tile, object2: GameObjectWithBody | Tile) => void;
      type GameObjectWithBody = Phaser.GameObjects.GameObject & { body: Body | StaticBody };
      class Body {}
      class StaticBody {}
      class Tile {}
    }
  }
  class Game {
    constructor(config: Types.Core.GameConfig);
  }
  const AUTO: number;
  namespace Math {
    function Between(min: number, max: number): number;
  }
  namespace Textures {
    class Texture {}
  }
  namespace Input {
    class InputPlugin {
      keyboard: {
        createCursorKeys(): Types.Input.Keyboard.CursorKeys;
      };
    }
  }
} 