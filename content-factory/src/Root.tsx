import {Composition} from 'remotion';
import {PuzzleReel, reelSchemaDefaults} from './PuzzleReel';
import {Carousel, carouselDefaults} from './Carousel';
import {UgcReel, ugcDefaults} from './UgcReel';
import {LineReel, lineDefaults, lineDuration} from './LineReel';
export const Root = () => (<>
  <Composition id="PuzzleReel" component={PuzzleReel} durationInFrames={30 * 15}
    fps={30} width={1080} height={1920} defaultProps={reelSchemaDefaults} />
  <Composition id="Carousel" component={Carousel} durationInFrames={4}
    fps={1} width={1080} height={1350} defaultProps={carouselDefaults} />
  <Composition id="UgcReel" component={UgcReel} durationInFrames={30 * 16}
    fps={30} width={1080} height={1920} defaultProps={ugcDefaults} />
  <Composition id="LineReel" component={LineReel} durationInFrames={lineDuration('scholars-mate')}
    calculateMetadata={({props}) => ({durationInFrames: lineDuration(props.id, 30, props.perMove)})}
    fps={30} width={1080} height={1920} defaultProps={lineDefaults} />
</>);
