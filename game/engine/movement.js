// Orthogonal BFS skeleton
export function getNeighbors(x,y){
 return [[x+1,y],[x-1,y],[x,y+1],[x,y-1]];
}
export function findReachable(board,start,maxMove){
 const q=[[...start,0]];
 const seen=new Set([start.join(',')]);
 const out=[];
 while(q.length){
  const [x,y,d]=q.shift();
  out.push([x,y]);
  if(d>=maxMove) continue;
  for(const [nx,ny] of getNeighbors(x,y)){
    if(nx<0||ny<0||nx>=6||ny>=7) continue;
    if(board[ny][nx]) continue;
    const k=`${nx},${ny}`;
    if(seen.has(k)) continue;
    seen.add(k);
    q.push([nx,ny,d+1]);
  }
 }
 return out;
}
