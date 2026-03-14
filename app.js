const OWNER="joshuak94"
const REPO="spirit-island-pairings"

populateDropdowns()
loadPairings()

function populateDropdowns(){

let s1=spirit1
let s2=spirit2
let filter=filterSpirit

filter.innerHTML="<option>All</option>"

spirits.forEach(s=>{

s1.innerHTML+=`<option>${s}</option>`
s2.innerHTML+=`<option>${s}</option>`
filter.innerHTML+=`<option>${s}</option>`

})

updateAspect("spirit1","aspect1")
updateAspect("spirit2","aspect2")

s1.onchange=()=>updateAspect("spirit1","aspect1")
s2.onchange=()=>updateAspect("spirit2","aspect2")

}

function updateAspect(s,a){

let spirit=document.getElementById(s).value
let box=document.getElementById(a)

box.innerHTML=""

aspects[spirit].forEach(x=>{
box.innerHTML+=`<option>${x}</option>`
})

}

function pairingKey(s1,a1,s2,a2){

let pair=[`${s1} (${a1})`,`${s2} (${a2})`]
pair.sort()

return pair.join(" + ")

}

async function fetchIssues(){

let r=await fetch(
`https://api.github.com/repos/${OWNER}/${REPO}/issues?labels=pairing`
)

return await r.json()

}

async function loadPairings(){

let issues=await fetchIssues()

let container=pairings
container.innerHTML=""

for(let issue of issues){

let comments=await fetch(issue.comments_url).then(r=>r.json())

let rating=parseRatings(comments)

if(!rating) continue

let div=document.createElement("div")
div.className="pairing"

div.innerHTML=`

<h3>${issue.title}</h3>

Votes: ${issue.reactions["+1"]}

<div>

Strength ${rating.strength}
<div class="bar"><div class="fill" style="width:${rating.strength*10}%"></div></div>

Synergy ${rating.synergy}
<div class="bar"><div class="fill" style="width:${rating.synergy*10}%"></div></div>

Theme ${rating.theme}
<div class="bar"><div class="fill" style="width:${rating.theme*10}%"></div></div>

Ratings: ${rating.count}

<a href="${issue.html_url}" target="_blank">View discussion</a>

</div>
`

container.appendChild(div)

}

}

function parseRatings(comments){

let totalS=0
let totalY=0
let totalT=0
let n=0

comments.forEach(c=>{

let s=c.body.match(/Strength:\s*(\d+)/)
let y=c.body.match(/Synergy:\s*(\d+)/)
let t=c.body.match(/Theme:\s*(\d+)/)

if(s&&y&&t){

totalS+=parseInt(s[1])
totalY+=parseInt(y[1])
totalT+=parseInt(t[1])

n++

}

})

if(n===0) return null

return{

strength:(totalS/n).toFixed(1),
synergy:(totalY/n).toFixed(1),
theme:(totalT/n).toFixed(1),
count:n

}

}

async function submitPairing(){

let s1=spirit1.value
let a1=aspect1.value
let s2=spirit2.value
let a2=aspect2.value

let strength=document.getElementById("strength").value
let synergy=document.getElementById("synergy").value
let theme=document.getElementById("theme").value

let reason=document.getElementById("reason").value

let title=pairingKey(s1,a1,s2,a2)

let comment=`

Strength: ${strength}
Synergy: ${synergy}
Theme: ${theme}

Reason:
${reason}
`

let url=`https://github.com/${OWNER}/${REPO}/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(comment)}&labels=pairing`

window.open(url)

}