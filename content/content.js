document.addEventListener("dblclick", () => {
    const selection = window.getSelection();

    if(!selection || selection.rangeCount === 0){
        return;
    }
    
    let selectedWord = selection.toString().normalize("NFC");
    selectedWord = selectedWord.replace(/[\u200C\u200D]/g, "");
    selectedWord = selectedWord.trim().toLowerCase();

    if(!selectedWord){
        return;
    }

    if(!/[\p{L}\p{N}]/u.test(selectedWord)){
        return;
    }

    const pageLanguage = getPageLanguage(selection);
    const languageResult = detectLanguage(selectedWord, pageLanguage);

    console.log("selected word:",selectedWord);
    console.log("page language:",pageLanguage);
    console.log("detected script:",detectScript(selectedWord))
    console.log("detected language:",languageResult);

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    showFloatingPopup(selectedWord, rect);

    chrome.runtime.sendMessage(
        {
            type: "LOOKUP_ENGLISH_WORD",
            word: selectedWord,
            languageResult: languageResult,
            pageLanguage: pageLanguage
        },

        function(response){
            if(chrome.runtime.lastError){
                console.log("Extension messaging error:",chrome.runtime.lastError.message);

                showPopupError(selectedWord, "Unable to contact dictionary serive.");
                return;
            }

            if(!response || !response.success){
                showPopupError(selectedWord, response?.error || "Something went wrong.");
                return;
            }
            console.log("complete dictionary entries:",response.data.entries);
            showDictionaryResult(selectedWord, response.data, languageResult, pageLanguage);
        }
    );
});

