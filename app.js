const SUPABASE_URL="https://supabase.com/dashboard/project/gldhthyaunfodjmhqlem"
const SUPABASE_KEY="sb_publishable_dUnIA9a7waanGtz__9vtJg_VYmJs3Uj"

const supabase = supabase.createClient(SUPABASE_URL,SUPABASE_KEY)

loadPairings()

function pairingKey(s1,a1,s2,a2){

let pair=[`${s1} (${a1})`,`${s2} (${a2})`]

pair.sort()

return pair.join(" + ")

}

async function submitPairing(){

let s1=spirit1.value
let a1=aspect1.value
let s2=spirit2.value
let a2=aspect2.value

let strength=parseInt(document.getElementById("strength").value)
let synergy=parseInt(document.getElementById("synergy").value)
let theme=parseInt(document.getElementById("theme").value)

let key=pairingKey(s1,a1,s2,a2)

let { data } = await supabase
.from("pairings")
.select("*")
.eq("pair_key",key)

if(data.length>0){

let p=data[0]

await supabase
.from("pairings")
.update({

strength_sum:p.strength_sum+strength,
synergy_sum:p.synergy_sum+synergy,
theme_sum:p.theme_sum+theme,

ratings:p.ratings+1,
votes:p.votes+1

})
.eq("pair_key",key)

}else{

await supabase
.from("pairings")
.insert({

pair_key:key,

spirit1:s1,
aspect1:a1,

spirit2:s2,
aspect2:a2,

strength_sum:strength,
synergy_sum:synergy,
theme_sum:theme,

ratings:1,
votes:1

})

}

loadPairings()

}

async function loadPairings(){

let { data } = await supabase
.from("pairings")
.select("*")

let container=document.getElementById("pairings")

container.innerHTML=""

data.forEach(p=>{

let strength=(p.strength_sum/p.ratings).toFixed(1)
let synergy=(p.synergy_sum/p.ratings).toFixed(1)
let theme=(p.theme_sum/p.ratings).toFixed(1)

let div=document.createElement("div")

div.className="pairing"

div.innerHTML=`

<h3>${p.spirit1} (${p.aspect1}) + ${p.spirit2} (${p.aspect2})</h3>

Votes: ${p.votes}

Strength ${strength}
<div class="bar"><div class="fill" style="width:${strength*10}%"></div></div>

Synergy ${synergy}
<div class="bar"><div class="fill" style="width:${synergy*10}%"></div></div>

Theme ${theme}
<div class="bar"><div class="fill" style="width:${theme*10}%"></div></div>

Ratings: ${p.ratings}

`

container.appendChild(div)

})

}