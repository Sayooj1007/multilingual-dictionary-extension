let activePopup = null;

function closeFloatingPopup(){
    if(activePopup){
        activePopup.remove();
        activePopup = null;
    }
}

document.addEventListener("pointerdown", (event) => {
    if(!activePopup){
        return;
    }

    const clickedInside = event.composedPath().includes(activePopup);

    if(!clickedInside){
        closeFloatingPopup();
    }
}, true);

document.addEventListener("keydown", (event) => {
    if(event.key == "Escape"){
        closeFloatingPopup();
    }
}, true);

window.addEventListener("scroll", () => {
    closeFloatingPopup();
}, true);

window.addEventListener("resize", () => {
    closeFloatingPopup();
}, true);


function showFloatingPopup(word, rect){
    closeFloatingPopup();

    const popup = document.createElement("div");
    popup.id = "dictionary-floating-popup";
    popup.dataset.word = word;

    const header = document.createElement("div");
    header.className = "dictionary-popup-header";

    const title = document.createElement("div");
    title.className = "dictionary-popup-word";
    title.textContent = word;

    const closeButton = document.createElement("button");
    closeButton.className = "dictionary-popup-close";
    closeButton.textContent = "×";
    closeButton.type = "button"
    closeButton.setAttribute("aria-label", "Close popup");

    closeButton.addEventListener("click", (event) => {
        event.stopPropagation();
        closeFloatingPopup();
    });

    header.appendChild(title);
    header.appendChild(closeButton);

    const content = document.createElement("div");
    content.className = "dictionary-popup-content";
    content.textContent = "Looking up definition...";

    popup.appendChild(header);
    popup.appendChild(content);

    document.body.appendChild(popup);

    activePopup = popup;

    const popupRect = popup.getBoundingClientRect();

    let left = rect.left + (rect.width/2) - (popupRect.width/2);
    let top = rect.top - popupRect.height -10;

    left = Math.max(10, Math.min(left, window.innerWidth - popupRect.width -10));
    top = Math.max(10, top);

    let arrowLeft = (rect.left + rect.width/2 - left);
    arrowLeft = Math.max(20, Math.min(arrowLeft, popupRect.width-20));

    popup.classList.add("popup-above");

    popup.style.left = `${left}px`;
    popup.style.top = `${top}px`;
    popup.style.setProperty("--arrow-left", `${arrowLeft}px`);  
}


async function showDictionaryResult(word, data, languageResult, pageLanguage = null){

    if(!activePopup || activePopup.dataset.word !== word){
        return;
    }

    const content = activePopup.querySelector(".dictionary-popup-content");

    if(!content) return;

    content.replaceChildren();

    const entries = Array.isArray(data.entries)
        ? data.entries:[];
    
    const candidates = languageResult?.candidates || [];

    const pageCode = pageLanguage?.trim()
        .toLowerCase()
        .split("-")[0];
    
    let selectedLanguageCode = languageResult?.code || null;

    // if the script has multiple candiates languages, inspect which candidates actually exist in API.
    if (!selectedLanguageCode && candidates.length > 0){
        console.log("candidates:",candidates);
        console.log("first api language:",entries[0]?.language);
        console.log("first api language code:",entries[0]?.language?.code);
        console.log("does urdu match?:",candidates.includes(entries[0]?.language?.code));
        const matchingEntries = entries.filter( entry => 
            candidates.includes(entry.language?.code)
        );
        const availableCodes = [...new Set(
            matchingEntries.map(entry => entry.language.code).filter(Boolean)
        )];
        console.log("matching language codes:",availableCodes);

        if (availableCodes.length === 1){
            selectedLanguageCode = availableCodes[0];
        }else if(pageCode && availableCodes.includes(pageCode)){
            selectedLanguageCode = pageCode;
        }else if(availableCodes.length > 1){
            showPopupError(word,
                "Multiple possible language found. Please use webpage with a language setting."
            );
            return;
        }
    }

    // latin-script words need webpage language as context.
    if (!selectedLanguageCode && detectScript(word).script === "Latin" && pageCode){
        selectedLanguageCode = pageCode;
    } 

    if (!selectedLanguageCode){
        showPopupError(word,"Unable to determine the language of the word.");
        return;
    }

    // keep matching entries belonging to the selected word.
    console.log("Selected word:", word);
    console.log("Selected language:", selectedLanguageCode);

    console.table(entries.map(entry => ({
        language: entry.language?.name,
        code: entry.language?.code,
        definition: entry.senses?.[0]?.definition
    })));
    const matchingEntries = entries.filter(entry => entry.language?.code === selectedLanguageCode);
    console.log("filtered entries:",matchingEntries);
    if (matchingEntries.length === 0){
        showPopupError(word,`No ${selectedLanguageCode} definition found.`);
        return;
    }

    let result = getDefinitonResult(matchingEntries);
    let selectedDefinition = result.definition;
    if (!selectedDefinition && result.baseWord){
        try{
            console.log("looking up base word:", result.baseWord);
            const baseDate = await requestDictionary(result.baseWord);
            const baseEntries = (baseDate.entries || []).filter(
                entry => entry.language?.code === selectedLanguageCode
            );
            const baseResult = getDefinitonResult(baseEntries);
            selectedDefinition = baseResult.definition;
            console.log("base word definition:",selectedDefinition);
        }catch(error){
            console.error("base word lookup failed:", error);
        }
    }
    if (!selectedDefinition){
        showPopupError(word, "No definiton available.");
        return;
    }
    // pronunciation section
    const pronunciation = document.createElement("div");
    pronunciation.className = "dictionary-pronunciation";
    
    // syllable patterns for english only
    if (selectedLanguageCode === "en"){
        const syllables = getSyllables(word);

        if (syllables.length > 0){
            const syllableElement = document.createElement("span");
            syllableElement.className = "dictionary-syllables";
            syllableElement.textContent = syllables.join("·");
            pronunciation.appendChild(syllableElement);
        }
    }

    const audioButton = document.createElement("button");
    audioButton.className = "dictionary-audio-button";
    audioButton.textContent ="🔊";
    audioButton.title = "Listen to pronunciation";
    audioButton.type = "button";

    audioButton.addEventListener("click", () => {
        console.log("Audio button clicked");
        if (!("speechSynthesis" in window)){
            console.error("Speech synthesis in not supported.");
            return;
        }
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(word);
        utterance.lang = selectedLanguageCode === "en"
            ? "en-US"
            : selectedLanguageCode;
        utterance.rate = 0.9
        window.speechSynthesis.speak(utterance);
    });
    pronunciation.appendChild(audioButton);
    
    content.appendChild(pronunciation);

    const definition = document.createElement("div");
    definition.className = "dictionary-popup-definition";
    definition.textContent = selectedDefinition;
    content.appendChild(definition);
}

function showPopupError(word, message){
    if(!activePopup || activePopup.dataset.word !== word){
        return;
    }

    const content = activePopup.querySelector(".dictionary-popup-content");

    if(content){
        content.textContent =message;
    }
}

function getDefinitonResult(entries){
    let baseWord = null;

    const patterns = [
        /^simple past and past participle of\s+(.+)$/i,
        /^simple past of\s+(.+)$/i,
        /^past participle of\s+(.+)$/i,
        /^third-person singular simple present\s+(.+)$/i,
        /^simple present of\s+(.+)$/i,
        /^present participle and gerund of\s+(.+)$/i,
        /^plural of\s+(.+)$/i,
        /^comparative of\s+(.+)$/i,
        /^superlative of\s+(.+)$/i,
    ];

    for (const  entry of entries){
        for (const sense of entry.senses || []){
            const definition = sense.definition?.trim();

            if (!definition) continue;
            let isGrammaticalDefinition = false;
            for (const pattern of patterns){
                const match = definition.match(pattern);

                if (match){
                    baseWord ||=match[1].trim().replace(/[.,;]+$/, "");
                    isGrammaticalDefinition = true;
                    break;
                }
            }
            if (!isGrammaticalDefinition){
                return{
                    definition: definition,
                    baseWord: null
                };
            }
        }
    }

    return {
        definition: null,
        baseWord: baseWord
    };
}

function requestDictionary(word){
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(
            {
                type: "LOOKUP_ENGLISH_WORD",
                word: word
            },
            response => {
                if (chrome.runtime.lastError){
                    reject(new Error(chrome.runtime.lastError.message));
                    return;
                }

                if (!response?.success){
                    reject(new Error(response?.error || "Dictionary lookup failed."));
                    return;
                }
                resolve(response.data);
            }
        );
    });
}