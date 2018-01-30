
export function loadHtml(
    html: string,
    widgetClassName: string
): { structure: JQuery; templates: JQuery; } {

    let wrap = $("<div>").html(html);

    $("head").append(wrap.find("style"));

    return {
        "structure": wrap.find(`.id_${widgetClassName}`),
        "templates": wrap.find(".templates")
    };

}
