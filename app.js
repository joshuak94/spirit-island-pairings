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
    let commentText = document.getElementById("comment").value.trim()

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
        if (commentText) {
            let currentComments = p.comments || []
            currentComments.push({ text: commentText, timestamp: new Date().toISOString() })

            await supabaseClient
                .from("pairings")
                .update({ comments: currentComments })
                .eq("pair_key", p.pair_key)
        }
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
                comments: commentText ? [{ text: commentText, timestamp: new Date().toISOString() }] : [],

                ratings: 1,
                votes: 1

            })
        alert("Pairing submitted!")

    }

    loadPairings()

}

// ---------------------
// Load and display pairings
// ---------------------
async function loadPairings() {

    // fetch all pairings from Supabase
    let { data } = await supabaseClient
        .from("pairings")
        .select("*")

    let filterSpirit = document.getElementById("filter-spirit").value
    let sortBy = document.getElementById("sort-by").value
    let top10 = document.getElementById("top10").checked

    let container = document.getElementById("pairings")
    container.innerHTML = ""

    // compute averages
    let pairings = data.map(p => ({
        ...p,
        strong: p.strong_sum / p.ratings,
        gamebreaking: p.gamebreaking_sum / p.ratings,
        thematic: p.thematic_sum / p.ratings,
        fun: p.fun_sum / p.ratings
    }))

    // filter by spirit if selected
    if (filterSpirit !== "all") {
        pairings = pairings.filter(p =>
            p.spirit1 === filterSpirit || p.spirit2 === filterSpirit
        )
    }

    // sort by selected metric
    pairings.sort((a, b) => {
        if (sortBy === "votes") return b.votes - a.votes
        return b[sortBy] - a[sortBy]
    })

    // show top 10 if checked
    if (top10) pairings = pairings.slice(0, 10)

    // get list of already voted pair_keys from localStorage
    let voted = JSON.parse(localStorage.getItem("votedPairings") || "[]")

    // render each pairing
    // render each pairing
    pairings.forEach(p => {
        let div = document.createElement("div")
        div.className = "pairing"

        div.innerHTML = `
        <h3>${p.spirit1} (${p.aspect1}) + ${p.spirit2} (${p.aspect2})</h3>

        <button id="vote-${p.pair_key}">👍 Upvote</button>
        <small>(Equivalent to submitting the same pairing with the same values as below.)</small><br><br>

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

        // COMMENTS
        if (p.comments && p.comments.length > 0) {
            // create button
            const toggleBtn = document.createElement("button")
            toggleBtn.textContent = `Show Comments (${p.comments.length})`
            toggleBtn.className = "toggle-comments-btn"

            // create comments container
            const commentsDiv = document.createElement("div")
            commentsDiv.style.display = "none"
            commentsDiv.style.marginTop = "5px"
            commentsDiv.style.marginLeft = "10px"

            // populate comments with numbers
            p.comments.forEach((c, i) => {
                const commentEl = document.createElement("div")
                commentEl.innerHTML = `<b>${i + 1}.</b> ${c.text} <small>(${new Date(c.timestamp).toLocaleString()})</small>`
                commentsDiv.appendChild(commentEl)
            })

            // attach toggle listener
            toggleBtn.addEventListener("click", () => {
                const isHidden = commentsDiv.style.display === "none"
                commentsDiv.style.display = isHidden ? "block" : "none"
                toggleBtn.textContent = isHidden
                    ? "Hide Comments"
                    : `Show Comments (${p.comments.length})`
            })

            // append button and comments div to pairing
            div.appendChild(toggleBtn)
            div.appendChild(commentsDiv)
        }

        container.appendChild(div)

        // Add new comment input
        const newCommentDiv = document.createElement("div")
        newCommentDiv.style.marginTop = "8px"
        newCommentDiv.innerHTML = `
    <textarea id="new-comment-${p.pair_key}" placeholder="Add a comment..." rows="2" style="width:100%"></textarea>
    <button>Add Comment</button>
`
        div.appendChild(newCommentDiv)
        // VOTE BUTTON
        let btn = document.getElementById("vote-" + p.pair_key)
        if (btn) {
            // disable if already voted
            if (voted.includes(p.pair_key)) {
                btn.disabled = true
                btn.textContent = "✓ Voted"
            } else {
                btn.addEventListener("click", () => upvotePairing(p.pair_key))
            }
        }

        const addBtn = newCommentDiv.querySelector("button")
        addBtn.addEventListener("click", async () => {
            const text = document.getElementById(`new-comment-${p.pair_key}`).value.trim()

            if (!text) return alert("Please write a comment before submitting.")

            // construct new comment object
            const newComment = {
                text,
                timestamp: new Date().toISOString()
            }

            // update Supabase
            const { error } = await supabaseClient
                .from("pairings")
                .update({
                    comments: [...(p.comments || []), newComment]
                })
                .eq("pair_key", p.pair_key)

            if (error) {
                alert("Failed to add comment: " + error.message)
            } else {
                // clear input and reload pairings
                document.getElementById(`new-comment-${p.pair_key}`).value = ""
                loadPairings()
            }
        })
    })
}


// ---------------------
// Upvote a pairing
// ---------------------
async function upvotePairing(key) {

    let voted = JSON.parse(localStorage.getItem("votedPairings") || "[]")

    if (voted.includes(key)) {
        alert("You already voted for this pairing.")
        return
    }

    voted.push(key)
    localStorage.setItem("votedPairings", JSON.stringify(voted))

    // fetch current pairing row
    let { data } = await supabaseClient
        .from("pairings")
        .select("*")
        .eq("pair_key", key)
        .single()

    if (!data) {
        alert("Error: pairing not found.")
        return
    }

    let p = data

    // compute current averages
    let strongAvg = p.strong_sum / p.ratings
    let gamebreakingAvg = p.gamebreaking_sum / p.ratings
    let thematicAvg = p.thematic_sum / p.ratings
    let funAvg = p.fun_sum / p.ratings

    // update the pairing: +1 vote, +1 rating, sums incremented by averages
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

    // immediately update the button UI
    let btn = document.getElementById("vote-" + key)
    if (btn) {
        btn.disabled = true
        btn.textContent = "✓ Voted"
    }

    // refresh the list
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