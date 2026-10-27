type Meta={id:string;question_number:number;question_mode?:'practice'|'tryout'|null};
export function regularPracticeCatalog<T extends Meta>(questions:T[],childFriendly:boolean,isGuest:boolean):T[]{
  const sorted=questions.filter(question=>question.question_mode!=='tryout'&&(!isGuest||question.question_number<=4)).sort((a,b)=>a.question_number-b.question_number);
  return childFriendly?sorted:sorted.slice(0,20);
}
export function mergePracticeResults<T>(previous:Record<string,T>,incoming:readonly (readonly [string,T])[]):Record<string,T>{
  return {...previous,...Object.fromEntries(incoming)};
}

export function shouldAdvancePractice(childFriendly:boolean,page:number,totalPages:number,results:readonly {isCorrect:boolean}[]):boolean {
  return childFriendly && page < totalPages - 1 && results.length > 0 && results.every(result=>result.isCorrect);
}
