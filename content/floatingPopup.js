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


function showDictionaryResult(word, data){

    if(!activePopup || activePopup.dataset.word !== word){
        return;
    }

    const content = activePopup.querySelector(".dictionary-popup-content");

    if(!content) return;

    content.replaceChildren();

    let selectedDefinition = "";

    for (const entry of data){
        if(!Array.isArray(entry.meanings)){
            continue;
        }
        console.log("entries:",data);

        for (const meaning of entry.meanings){

            if (!Array.isArray(meaning.definitions)){
                continue;
            }

            for (const item of meaning.definitions){
                const definition = item.definition?.trim();

                if (definition){
                    selectedDefinition = definition;
                    break;
                }
            }
            if(selectedDefinition) break;
        }
        if(selectedDefinition) break;
    }
    if (!selectedDefinition){
        showPopupError(word, "No definition found.")
    }
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