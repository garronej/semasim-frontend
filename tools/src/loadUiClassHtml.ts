
export function loadUiClassHtml(
    html: string,
    widgetClassName: string
): { structure: JQuery; templates: JQuery; } {

    const wrap = $("<div>").html(html);

    $("head").append(wrap.find("style"));

    return {
        "structure": wrap.find(`.id_${widgetClassName}`),
        "templates": wrap.find(".templates")
    };

}
