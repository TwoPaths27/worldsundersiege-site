
const state={player:1,energy:[1,1],max:[1,1],selected:null,grid:Array(42).fill(null),
hands:[[...Array(6)].map((_,i)=>({name:'Unit '+(i+1),atk:2,hp:3,spd:2})),[...Array(6)].map((_,i)=>({name:'Enemy '+(i+1),atk:2,hp:3,spd:2}))]};
const board=document.getElementById('board');
for(let i=0;i<42;i++){let d=document.createElement('div');d.className='cell';d.dataset.i=i;d.onclick=()=>clickCell(i);board.appendChild(d);}
function render(){
document.getElementById('turn').textContent='Player '+state.player;
document.getElementById('energy').textContent='Energy '+state.energy[state.player-1]+'/'+state.max[state.player-1];
const hand=document.getElementById('hand');hand.innerHTML='';
state.hands[state.player-1].forEach((c,idx)=>{let e=document.createElement('div');e.className='card';e.textContent=c.name;e.onclick=()=>recruit(idx);hand.appendChild(e);});
[...board.children].forEach((c,i)=>{c.className='cell';let u=state.grid[i];c.textContent=u?u.name[0]:'';if(state.selected===i)c.classList.add('sel');});
document.getElementById('info').textContent=state.selected!=null?JSON.stringify(state.grid[state.selected],null,2):'None';
}
function recruit(idx){let zones=state.player===1?[36,37,38]:[3,4,5];let pos=zones.find(p=>!state.grid[p]);if(pos==null)return alert('Recruit area full');state.grid[pos]=state.hands[state.player-1].splice(idx,1)[0];render();}
function clickCell(i){if(state.grid[i]){state.selected=i;render();return;} if(state.selected!=null){state.grid[i]=state.grid[state.selected];state.grid[state.selected]=null;state.selected=i;render();}}
document.getElementById('end').onclick=()=>{state.player=state.player===1?2:1;state.max[state.player-1]++;state.energy[state.player-1]=state.max[state.player-1];state.selected=null;render();};
render();
