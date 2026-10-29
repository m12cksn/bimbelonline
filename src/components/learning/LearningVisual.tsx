import MissingAddend from './MissingAddend';
import VisualArithmetic from './VisualArithmetic';
import CountingVisual from './CountingVisual';
import NumberSequence from './NumberSequence';
import ComparisonVisual from './ComparisonVisual';
import ShapeVisual from './ShapeVisual';
import PlaceValue from './PlaceValue';
export default function LearningVisual({prompt,variation,answer,onAnswerChange,disabled}:{prompt:string;variation:number;answer?:string;onAnswerChange?:(value:string)=>void;disabled?:boolean}) {
  return <><MissingAddend prompt={prompt}/><VisualArithmetic prompt={prompt} variation={variation}/><CountingVisual prompt={prompt}/><NumberSequence prompt={prompt} answer={answer} onAnswerChange={onAnswerChange} disabled={disabled}/><ComparisonVisual prompt={prompt}/><ShapeVisual prompt={prompt}/><PlaceValue prompt={prompt}/></>;
}
