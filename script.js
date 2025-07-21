// DOM elements
let searchWordInput = document.getElementById('search_word');
let cardTitle = document.getElementById('card_title');
let wordMeaning = document.getElementById('word_meaning');
let wordExample = document.getElementById('word_example');
let wordPronunciation = document.getElementById('word_pronounciation');
let wordAudioSource = document.getElementById('word_audio_source');
let wordAudio = document.getElementById('word_audio');
let audioBtn = document.getElementById('audio_btn');
let searchBtn = document.getElementById('search_btn');
let resetBtn = document.getElementById('reset_btn');
let bookmarkIcon = document.getElementById('bookmark_icon');
let wordResultCard = document.getElementById('show_result');
let recentSearchSection = document.getElementById("word_history_section");
let recentTitle = document.getElementById("recent_search_title");

// Hide loader initially
$(window).on('load', function () {
    $('#loading_animation').hide();
    displayRecentWords();
    displayBookmarks();
    displayQuote();
});

// Fetch quote
async function displayQuote() {
    try {
        let res = await fetch("https://type.fit/api/quotes");
        let data = await res.json();
        let random = Math.floor(Math.random() * data.length);
        document.getElementById("quote").innerText = `"${data[random].text}"`;
        document.getElementById("author").innerText = `~${data[random].author || "Anonymous"}`;
    } catch {
        document.getElementById("quote").innerText = `"Keep learning!"`;
        document.getElementById("author").innerText = `~AI`;
    }
}

// Search button click
searchBtn.addEventListener('click', async () => {
    let word = searchWordInput.value.trim();
    if (!word) {
        new bootstrap.Toast(document.getElementById('liveToast')).show();
        return;
    }

    $('#loading_animation').show();
    wordResultCard.style.display = "none";

    try {
        await fetchWord(word);
        saveToRecent(word);
    } finally {
        $('#loading_animation').hide();
        wordResultCard.style.display = "block";
        recentSearchSection.style.display = "block";
    }
});

// Reset button
resetBtn.addEventListener('click', () => {
    searchWordInput.value = "";
    wordResultCard.style.display = "none";
});

// Fetch dictionary info
async function fetchWord(word) {
    try {
        const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
        const data = await res.json();

        if (!res.ok) throw data;

        const { word: w, meanings, phonetics, origin } = data[0];
        cardTitle.innerText = w;

        // Pronunciation
        const phoneticText = phonetics.find(p => p.text)?.text || "N/A";
        const audioURL = phonetics.find(p => p.audio)?.audio || "";
        wordPronunciation.innerHTML = `<b><i>Pronunciation:</i></b> ${phoneticText}`;
        wordAudioSource.src = audioURL;
        audioBtn.style.display = audioURL ? "inline-block" : "none";

        // Origin
        let originHTML = origin ? `<b><i>Origin:</i></b> ${origin}<br><br>` : "";

        // Meanings
        let meaningHTML = meanings.map(m => `
            <div>
                <b>Part of Speech:</b> ${m.partOfSpeech}<br>
                <b>Definitions:</b>
                <ol>
                    ${m.definitions.map(d => `
                        <li>
                            ${d.definition}
                            ${d.example ? `<br><b>Example:</b> "${d.example}"` : ""}
                            ${d.synonyms?.length ? `<br><b>Synonyms:</b> ${d.synonyms.join(", ")}` : ""}
                            ${d.antonyms?.length ? `<br><b>Antonyms:</b> ${d.antonyms.join(", ")}` : ""}
                        </li>
                    `).join('')}
                </ol><br>
            </div>
        `).join('');

        wordMeaning.innerHTML = originHTML + meaningHTML;
        wordExample.innerHTML = "";
        bookmarkIcon.style.display = "inline-block";
        bookmarkIcon.querySelector("i").className = "bi bi-bookmark";

    } catch (err) {
        cardTitle.innerText = err.title || "Word Not Found";
        wordMeaning.innerHTML = `<b><i>Error:</i></b> ${err.message || "No results found."}`;
        wordExample.innerHTML = `<b><i>Note:</i></b> ${err.resolution || ""}`;
        wordPronunciation.innerText = "";
        audioBtn.style.display = "none";
        bookmarkIcon.style.display = "none";
    }
}

// Audio button
audioBtn.addEventListener("click", () => {
    audioBtn.querySelector("i").className = "bi bi-volume-down-fill";
    wordAudio.load();
    wordAudio.play();
    wordAudio.onended = () => {
        audioBtn.querySelector("i").className = "bi bi-volume-down";
    };
});

// Save to recent
function saveToRecent(word) {
    const item = {
        title: cardTitle.innerText,
        meaning: wordMeaning.innerText.substring(0, 120) + "..."
    };
    let recent = JSON.parse(localStorage.getItem("recently_searched") || "[]");
    recent.push(item);
    if (recent.length > 5) recent.shift();
    localStorage.setItem("recently_searched", JSON.stringify(recent));
    displayRecentWords();
}

// Display recent
function displayRecentWords() {
    let recent = JSON.parse(localStorage.getItem("recently_searched") || "[]");
    const container = document.getElementById("recently_searched");
    if (recent.length === 0) {
        recentTitle.style.display = "none";
        container.innerHTML = "";
        return;
    }
    recentTitle.style.display = "block";
    container.innerHTML = recent.map(r => `
        <div class="recent_word my-2 mx-2 card" style="width: 20rem;">
            <div class="card-body">
                <button id="recent_popover" type="button" class="btn" data-bs-toggle="popover"
                    data-bs-trigger="hover focus" data-bs-placement="bottom"
                    title="${r.title}" data-bs-content="${r.meaning}">
                    <h5 class="card-title">${r.title}</h5>
                </button>
            </div>
        </div>
    `).join('');

    // Activate popovers
    new bootstrap.Popover(document.querySelector('[data-bs-toggle="popover"]'));
}

// Bookmarks
bookmarkIcon.addEventListener("click", () => {
    let word = cardTitle.innerText;
    let bookmarks = JSON.parse(localStorage.getItem("bookmarked_words") || "[]");
    if (!bookmarks.includes(word)) {
        bookmarks.push(word);
        bookmarkIcon.querySelector("i").className = "bi bi-bookmark-check-fill";
    } else {
        bookmarks = bookmarks.filter(w => w !== word);
        bookmarkIcon.querySelector("i").className = "bi bi-bookmark";
    }
    localStorage.setItem("bookmarked_words", JSON.stringify(bookmarks));
    displayBookmarks();
});

function displayBookmarks() {
    let bookmarks = JSON.parse(localStorage.getItem("bookmarked_words") || "[]");
    const container = document.getElementById("bookmarked_words_element");
    if (bookmarks.length === 0) {
        container.innerHTML = "<h5>No words bookmarked!</h5>";
        return;
    }
    container.innerHTML = bookmarks.map((word, index) => `
        <li id="${index}">
            <h4>${word}
                <button id="${index}" type="button" class="btn-close text-reset"
                    aria-label="Close" onclick="deleteBookmark(${index})">
                </button>
            </h4>
        </li>
        <br>
    `).join('');
}

function deleteBookmark(index) {
    let bookmarks = JSON.parse(localStorage.getItem("bookmarked_words") || "[]");
    bookmarks.splice(index, 1);
    localStorage.setItem("bookmarked_words", JSON.stringify(bookmarks));
    displayBookmarks();
}

// Back to top button
let backToTopBtn = document.getElementById("btn-back-to-top");
window.onscroll = () => {
    backToTopBtn.style.display = (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) ? "block" : "none";
};
backToTopBtn.addEventListener("click", () => {
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
});
