import {parseVisualArithmetic} from './visualArithmetic';
import {parseIconArithmetic} from './iconArithmetic';
import {parseStoryVisual} from './storyVisual';
import {parseCountingVisual} from './countingVisual';
export function contextualAnswer(prompt:string):{kind:'equation';left:number;right:number;operator:string}|{kind:'quantity';noun:string}|null {
 const story=parseStoryVisual(prompt);
 if(story)return {kind:'quantity',noun:story.scene.noun};
 const arithmetic=parseVisualArithmetic(prompt)??parseIconArithmetic(prompt);
 if(arithmetic)return {kind:'equation',left:arithmetic.left,right:arithmetic.right,operator:arithmetic.operation==='add'?'+':'−'};
 const counting=parseCountingVisual(prompt);
 return counting?{kind:'quantity',noun:counting.name}:null;
}
