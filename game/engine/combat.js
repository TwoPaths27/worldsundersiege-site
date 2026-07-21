export function hasLineOfSight(board,a,b){
 if(a.x===b.x){
   const step=a.y<b.y?1:-1;
   for(let y=a.y+step;y!==b.y;y+=step) if(board[y][a.x]) return false;
   return true;
 }
 if(a.y===b.y){
   const step=a.x<b.x?1:-1;
   for(let x=a.x+step;x!==b.x;x+=step) if(board[a.y][x]) return false;
   return true;
 }
 return false;
}
