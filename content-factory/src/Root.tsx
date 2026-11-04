import {Composition} from 'remotion';
import {PuzzleReel, reelSchemaDefaults} from './PuzzleReel';
export const Root = () => (
  <Composition id="PuzzleReel" component={PuzzleReel} durationInFrames={30 * 15}
    fps={30} width={1080} height={1920} defaultProps={reelSchemaDefaults} />
);
