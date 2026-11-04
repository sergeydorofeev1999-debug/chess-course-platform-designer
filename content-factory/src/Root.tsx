import {Composition} from 'remotion';
import {PuzzleReel, reelSchemaDefaults} from './PuzzleReel';
import {Carousel, carouselDefaults} from './Carousel';
export const Root = () => (<>
  <Composition id="PuzzleReel" component={PuzzleReel} durationInFrames={30 * 15}
    fps={30} width={1080} height={1920} defaultProps={reelSchemaDefaults} />
  <Composition id="Carousel" component={Carousel} durationInFrames={4}
    fps={1} width={1080} height={1350} defaultProps={carouselDefaults} />
</>);
