const SUPABASE_URL = "https://gldhthyaunfodjmhqlem.supabase.co/"
const SUPABASE_KEY = "sb_publishable_dUnIA9a7waanGtz__9vtJg_VYmJs3Uj"

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY)

loadPairings()

function pairingKey(s1, a1, s2, a2) {

    let pair = [`${s1} (${a1})`, `${s2} (${a2})`]

    pair.sort()

    return pair.join(" + ")

}

function updateSpirit2Options() {

    const s1 = document.getElementById("spirit1").value
    const s2 = document.getElementById("spirit2")

    s2.innerHTML = ""

    spirits.forEach(spirit => {

        if (spirit !== s1) {

            const option = document.createElement("option")
            option.value = spirit
            option.textContent = spirit
            s2.appendChild(option)

        }

    })

    updateAspect("spirit2", "aspect2")
}

async function submitPairing() {

    const s1 = document.getElementById("spirit1").value
    const s2 = document.getElementById("spirit2").value
    const a1 = document.getElementById("aspect1").value
    const a2 = document.getElementById("aspect2").value

    if (!s1 || !s2) {

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

    let filterSpirit = document.getElementById("filter-spirit").value
    let sortBy = document.getElementById("sort-by").value
    let top10 = document.getElementById("top10").checked

    let container = document.getElementById("pairings")
    container.innerHTML = ""

    let pairings = data.map(p => {

        return {

            ...p,

            strong: p.strong_sum / p.ratings,
            gamebreaking: p.gamebreaking_sum / p.ratings,
            thematic: p.thematic_sum / p.ratings,
            fun: p.fun_sum / p.ratings

        }

    })

    if (filterSpirit !== "all") {

        pairings = pairings.filter(p =>

            p.spirit1 === filterSpirit ||
            p.spirit2 === filterSpirit

        )

    }

    pairings.sort((a, b) => {

        if (sortBy === "votes") {
            return b.votes - a.votes
        }

        return b[sortBy] - a[sortBy]

    })

    if (top10) {
        pairings = pairings.slice(0, 10)
    }

    pairings.forEach(p => {

        let div = document.createElement("div")
        let voted = JSON.parse(localStorage.getItem("votedPairings") || "[]")

        if (voted.includes(p.pair_key)) {
            setTimeout(() => {
                let btn = document.getElementById("vote-" + p.pair_key)
                if (btn) btn.disabled = true
            }, 0)
        }
        div.className = "pairing"

        div.innerHTML = `
    
    <h3>${p.spirit1} (${p.aspect1}) + ${p.spirit2} (${p.aspect2})</h3>

    <button onclick="upvotePairing('${p.pair_key}')" id="vote-${p.pair_key}">
    👍 Upvote
    </button>
    Upvote: Equivalent to submitting the same pairing with the same values as below
    
    Strong ${p.strong.toFixed(1)}
    <div class="bar"><div class="fill" style="width:${p.strong * 10}%"></div></div>
    
    Gamebreaking ${p.gamebreaking.toFixed(1)}
    <div class="bar"><div class="fill" style="width:${p.gamebreaking * 10}%"></div></div>
    
    Thematic ${p.thematic.toFixed(1)}
    <div class="bar"><div class="fill" style="width:${p.thematic * 10}%"></div></div>
    
    Fun ${p.fun.toFixed(1)}
    <div class="bar"><div class="fill" style="width:${p.fun * 10}%"></div></div>
    
    Ratings: ${p.ratings}
    
    `

        container.appendChild(div)

    })

}

async function upvotePairing(key) {

    let voted = JSON.parse(localStorage.getItem("votedPairings") || "[]")

    if (voted.includes(key)) {
        alert("You already voted for this pairing.")
        return
    }

    voted.push(key)
    localStorage.setItem("votedPairings", JSON.stringify(voted))

    // get current pairing data
    let { data } = await supabaseClient
        .from("pairings")
        .select("*")
        .eq("pair_key", key)
        .single()

    let p = data

    // compute averages
    let strongAvg = p.strong_sum / p.ratings
    let gamebreakingAvg = p.gamebreaking_sum / p.ratings
    let thematicAvg = p.thematic_sum / p.ratings
    let funAvg = p.fun_sum / p.ratings

    // update database
    await supabaseClient
        .from("pairings")
        .update({

            votes: p.votes + 1,
            ratings: p.ratings + 1,

            strong_sum: p.strong_sum + strongAvg,
            gamebreaking_sum: p.gamebreaking_sum + gamebreakingAvg,
            thematic_sum: p.thematic_sum + thematicAvg,
            fun_sum: p.fun_sum + funAvg

        })
        .eq("pair_key", key)

    // disable the button immediately
    let btn = document.getElementById("vote-"+key)

    if(btn){
        btn.disabled = true
        btn.textContent = "✓ Voted"
    }
    // refresh list
    loadPairings()

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

    // Populate dropdowns
    populateDropdowns();
    let filter = document.getElementById("filter-spirit");

    spirits.forEach(s => {

        let option = document.createElement("option")
        option.value = s
        option.textContent = s

        filter.appendChild(option)

    })
    updateSpirit2Options();

    // Spirit dropdown listeners
    document.getElementById("spirit1")
        .addEventListener("change", () => {
            updateAspect("spirit1", "aspect1");
            updateSpirit2Options();
        });

    document.getElementById("spirit2")
        .addEventListener("change", () => updateAspect("spirit2", "aspect2"));

    document.getElementById("filter-spirit").addEventListener("change", loadPairings);
    document.getElementById("sort-by").addEventListener("change", loadPairings);
    document.getElementById("top10").addEventListener("change", loadPairings);
    // Load existing pairings from Supabase
    loadPairings();

    // Slider live-value display
    const sliders = ["strong", "gamebreaking", "thematic", "fun"];

    sliders.forEach(id => {
        const input = document.getElementById(id);
        const valueSpan = document.getElementById(id + "-value");

        if (!input || !valueSpan) return;   // prevents crashes

        valueSpan.textContent = input.value;

        input.addEventListener("input", e => {
            valueSpan.textContent = e.target.value;
        });
    });

});