const SUPABASE_URL = "https://gldhthyaunfodjmhqlem.supabase.co/"
const SUPABASE_KEY = "sb_publishable_dUnIA9a7waanGtz__9vtJg_VYmJs3Uj"

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY)

loadPairings()

function pairingKey(s1, a1, s2, a2) {

    let pair = [`${s1} (${a1})`, `${s2} (${a2})`]

    pair.sort()

    return pair.join(" + ")

}

async function submitPairing() {

    const s1 = document.getElementById("spirit1").value
    const s2 = document.getElementById("spirit2").value
    const a1 = document.getElementById("aspect1").value
    const a2 = document.getElementById("aspect2").value

    if(!s1 || !s2){

        alert("Please select both spirits before submitting.")
        return
        
        }

    let strong = parseInt(document.getElementById("strong").value)
    let gamebreaking = parseInt(document.getElementById("gamebreaking").value)
    let thematic = parseInt(document.getElementById("thematic").value)
    let fun = parseInt(document.getElementById("fun").value)

    let key = pairingKey(s1, a1, s2, a2)

    let { data } = await supabaseClient
        .from("pairings")
        .select("*")
        .eq("pair_key", key)

    if (data.length > 0) {

        let p = data[0]

        await supabaseClient
            .from("pairings")
            .update({

                strong_sum: p.strong_sum + strong,
                gamebreaking_sum: p.gamebreaking_sum + gamebreaking,
                thematic_sum: p.thematic_sum + thematic,
                fun_sum: p.fun_sum + fun,

                ratings: p.ratings + 1,
                votes: p.votes + 1

            })
            .eq("pair_key", key)
        alert("Rating added to existing pairing!")

    } else {

        await supabaseClient
            .from("pairings")
            .insert({

                pair_key: key,

                spirit1: s1,
                aspect1: a1,

                spirit2: s2,
                aspect2: a2,

                strong_sum: strong,
                gamebreaking_sum: gamebreaking,
                thematic_sum: thematic,
                fun_sum: fun,

                ratings: 1,
                votes: 1

            })
        alert("Pairing submitted!")

    }

    loadPairings()

}

async function loadPairings() {

    let { data } = await supabaseClient
        .from("pairings")
        .select("*")

    let container = document.getElementById("pairings")

    container.innerHTML = ""

    data.forEach(p => {

        let strong = (p.strong_sum / p.ratings).toFixed(1)
        let gamebreaking = (p.gamebreaking_sum / p.ratings).toFixed(1)
        let thematic = (p.thematic_sum / p.ratings).toFixed(1)
        let fun = (p.fun_sum / p.ratings).toFixed(1)

        let div = document.createElement("div")

        div.className = "pairing"

        div.innerHTML = `

<h3>${p.spirit1} (${p.aspect1}) + ${p.spirit2} (${p.aspect2})</h3>

Votes: ${p.votes}

Strong ${strong}
<div class="bar"><div class="fill" style="width:${strong * 10}%"></div></div>

Gamebreaking ${gamebreaking}
<div class="bar"><div class="fill" style="width:${gamebreaking * 10}%"></div></div>

Thematic ${thematic}
<div class="bar"><div class="fill" style="width:${thematic * 10}%"></div></div>

Fun ${fun}
<div class="bar"><div class="fill" style="width:${fun * 10}%"></div></div>

Ratings: ${p.ratings}

`

        container.appendChild(div)

    })

}

function populateDropdowns() {

    const s1 = document.getElementById("spirit1");
    const s2 = document.getElementById("spirit2");

    s1.innerHTML = "";
    s2.innerHTML = "";

    spirits.forEach(spirit => {

        let option1 = document.createElement("option");
        option1.value = spirit;
        option1.textContent = spirit;
        s1.appendChild(option1);

        let option2 = document.createElement("option");
        option2.value = spirit;
        option2.textContent = spirit;
        s2.appendChild(option2);

    });

    updateAspect("spirit1", "aspect1");
    updateAspect("spirit2", "aspect2");

}

function updateAspect(spiritID, aspectID) {

    const spirit = document.getElementById(spiritID).value;
    const aspectSelect = document.getElementById(aspectID);

    aspectSelect.innerHTML = "";

    aspects[spirit].forEach(a => {

        let option = document.createElement("option");
        option.value = a;
        option.textContent = a;

        aspectSelect.appendChild(option);

    });

}

window.addEventListener("DOMContentLoaded", () => {

    populateDropdowns();

    document.getElementById("spirit1")
        .addEventListener("change", () => updateAspect("spirit1", "aspect1"));

    document.getElementById("spirit2")
        .addEventListener("change", () => updateAspect("spirit2", "aspect2"));

    loadPairings();
    const sliders = ["strong", "gamebreaking", "thematic", "fun"];
    sliders.forEach(id => {
        const input = document.getElementById(id);
        const valueSpan = document.getElementById(id + "-value");
        input.addEventListener("input", e => {
            valueSpan.textContent = e.target.value;
        });
    });

});