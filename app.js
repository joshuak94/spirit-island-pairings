const OWNER = "joshuak94"
const REPO = "spirit-island-pairings"

populateDropdowns()
loadPairings()

function populateDropdowns(){

let s1=document.getElementById("spirit1")
let s2=document.getElementById("spirit2")
let filter=document.getElementById("filterSpirit")

filter.innerHTML="<option>All</option>"

spirits.forEach(s=>{

s1.innerHTML+=`<option>${s}</option>`
s2.innerHTML+=`<option>${s}</option>`
filter.innerHTML+=`<option>${s}</option>`

})

updateAspectDropdown("spirit1","aspect1")
updateAspectDropdown("spirit2","aspect2")

s1.onchange=()=>updateAspectDropdown("spirit1","aspect1")
s2.onchange=()=>updateAspectDropdown("spirit2","aspect2")

}


function updateAspectDropdown(spiritID,aspectID){

let spirit=document.getElementById(spiritID).value
let aspectSelect=document.getElementById(aspectID)

aspectSelect.innerHTML=""

aspects[spirit].forEach(a=>{
aspectSelect.innerHTML+=`<option>${a}</option>`
})

}


async function loadPairings(){

let response=await fetch(
`https://api.github.com/repos/${OWNER}/${REPO}/issues?labels=pairing`
)

let issues=await response.json()

issues.sort((a,b)=>b.reactions["+1"]-a.reactions["+1"])

let container=document.getElementById("pairings")

container.innerHTML=""

issues.forEach(issue=>{

let div=document.createElement("div")

div.className="pairing"

div.innerHTML=`

<h3>${issue.title}</h3>

<div>
👍 ${issue.reactions["+1"]}
</div>

<p>${issue.body}</p>

<a href="${issue.html_url}" target="_blank">
Vote or add reasons
</a>

`

container.appendChild(div)

})

}

function submitPairing(){

let s1=spirit1.value
let a1=aspect1.value
let s2=spirit2.value
let a2=aspect2.value

let reason=document.getElementById("reason").value
let type=document.getElementById("reasonType").value

let title=`${s1} (${a1}) + ${s2} (${a2})`

let body=`Reason Type: ${type}

${reason}`

let url=`https://github.com/${OWNER}/${REPO}/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}&labels=pairing`

window.open(url,"_blank")

}
