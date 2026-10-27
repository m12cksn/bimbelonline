import VisualArithmetic from './VisualArithmetic';
import CountingVisual from './CountingVisual';
import NumberSequence from './NumberSequence';
import ComparisonVisual from './ComparisonVisual';
import ShapeVisual from './ShapeVisual';
import PlaceValue from './PlaceValue';
export default function LearningVisual({prompt,variation}:{prompt:string;variation:number}) {
  return <><VisualArithmetic prompt={prompt} variation={variation}/><CountingVisual prompt={prompt}/><NumberSequence prompt={prompt}/><ComparisonVisual prompt={prompt}/><ShapeVisual prompt={prompt}/><PlaceValue prompt={prompt}/></>;
}
