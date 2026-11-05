document.addEventListener("dblclick", () => {
    const selection = window.getSelection();

    if(!selection){
        return;
    }
    
    let selectedWord = selection.toString().normalize("NFC");
    selectedWord = selectedWord.replace(/[\u200C\u200D]/g, "");
    selectedWord = selectedWord.trim();

    if(!selectedWord){
        return;
    }

    if(!/[\p{L}\p{N}]/u.test(selectedWord)){
        return;
    }
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    showFloatingPopup(selectedWord, rect);
    console.log("Detected word:", selectedWord)

    chrome.runtime.sendMessage(
        {
            type: "LOOKUP_ENGLISH_WORD",
            word: selectedWord
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

            showDictionaryResult(selectedWord, response.data);
        }
    );
});

