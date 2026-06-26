let DB = {};
let items = [];

const tierPrices = {
    1: 22,
    2: 17,
    3: 15,
    4: 16
};

const legaMultipliers = {
    0: 1,
    1: 1.2,
    2: 1.4,
    3: 1.6,
    4: 1.8,
    5: 2
};

document
    .getElementById("csvFile")
    .addEventListener("change", loadCSV);

function loadCSV(event) {

    const file = event.target.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = function(e) {

        DB = {};

        const rows = e.target.result
            .split(/\r?\n/)
            .filter(row => row.trim());

        rows.forEach(row => {

            const parts = row.split(",");

            if (parts.length < 4)
                return;

            const name = parts[0].trim();

            DB[name] = {
                lvl: Number(parts[1]),
                es: Number(parts[2]),
                tier: Number(parts[3])
            };
        });

        alert(
            "Wczytano bazę: "
            + Object.keys(DB).length
            + " itemów"
        );
    };

    reader.readAsText(file, "utf-8");
}

function getLevelMultiplier(lvl) {

    if (lvl <= 114)
        return 0.7;

    if (lvl <= 217)
        return 0.8;

    return 1;
}

function calculate(item) {

    if (!item.es)
        return 0;

    return Math.floor(
        item.es *
        tierPrices[item.tier] *
        legaMultipliers[item.lega] *
        getLevelMultiplier(item.lvl)
    );
}

function importLog() {

    const text =
        document.getElementById("logInput")
        .value;

    if (!text.trim()) {
        alert("Wklej log");
        return;
    }

    const lines =
        text.split(/\r?\n/);

    let found = 0;
    let missing = 0;

    lines.forEach(line => {

        line = line.trim();

        if (!line.includes("ITEM#"))
            return;

        const itemPos =
            line.indexOf(" ITEM#");

        if (itemPos === -1)
            return;

        const name =
            line.substring(0, itemPos)
            .trim();

        const id =
            line.substring(itemPos + 1)
            .trim();

        const dbItem =
            DB[name];

if (dbItem) {

    found++;

    items.push({
        id,
        name,
        lvl: dbItem.lvl,
        es: dbItem.es,
        tier: dbItem.tier,
        lega: 0,
        missing: false
    });

} else {

    missing++;

    items.push({
        id,
        name,
        lvl: "",
        es: "",
        tier: 1,
        lega: 0,
        missing: true
    });

}
    });

    document.getElementById(
        "foundCount"
    ).textContent = found;

    document.getElementById(
        "missingCount"
    ).textContent = missing;

    render();
}

function render() {

    const tbody =
        document.getElementById(
            "tableBody"
        );

    tbody.innerHTML = "";

    // Sortowanie:
    // 1. Przedmioty z bazy
    // 2. Po lvl malejąco
    // 3. Braki w bazie zawsze na dole

    items.sort((a, b) => {

        if (a.missing && !b.missing)
            return 1;

        if (!a.missing && b.missing)
            return -1;

        const lvlA = Number(a.lvl) || 0;
        const lvlB = Number(b.lvl) || 0;

        return lvlB - lvlA;

    });

    let total = 0;

    items.forEach((item, index) => {

        const result =
            calculate(item);

        total += result;

        tbody.innerHTML += `
        <tr>

            <td>${item.id}</td>

            <td>
                ${item.name}
                ${item.missing
                    ? '<br><small style="color:red">BRAK W BAZIE</small>'
                    : ''}
            </td>

            <td>
                ${
                    item.es
                    ? item.es
                    : '?'
                }
            </td>

            <td>

                <select
                    onchange="
                        items[${index}].tier =
                        Number(this.value);
                        render();
                    ">

                    <option
                        value="1"
                        ${item.tier == 1
                            ? 'selected'
                            : ''}>
                        Tier 1
                    </option>

                    <option
                        value="2"
                        ${item.tier == 2
                            ? 'selected'
                            : ''}>
                        Tier 2
                    </option>

                    <option
                        value="3"
                        ${item.tier == 3
                            ? 'selected'
                            : ''}>
                        Tier 3
                    </option>

                    <option
                        value="4"
                        ${item.tier == 4
                            ? 'selected'
                            : ''}>
                        Tier 4
                    </option>

                </select>

            </td>

            <td>

                <select
                    onchange="
                        items[${index}].lega =
                        Number(this.value);
                        render();
                    ">

                    <option value="0" ${item.lega == 0 ? 'selected' : ''}>+0</option>
                    <option value="1" ${item.lega == 1 ? 'selected' : ''}>+1</option>
                    <option value="2" ${item.lega == 2 ? 'selected' : ''}>+2</option>
                    <option value="3" ${item.lega == 3 ? 'selected' : ''}>+3</option>
                    <option value="4" ${item.lega == 4 ? 'selected' : ''}>+4</option>
                    <option value="5" ${item.lega == 5 ? 'selected' : ''}>+5</option>

                </select>

            </td>

            <td>
                ${
                    item.lvl
                    ? item.lvl
                    : '?'
                }
            </td>

            <td>
                ${
                    item.missing
                    ? "-"
                    : result + "m"
                }
            </td>

            <td>

                <button
                    class="delete"
                    onclick="
                        deleteItem(
                            ${index}
                        )
                    ">

                    Usuń

                </button>

            </td>

        </tr>
        `;
    });

    document.getElementById(
        "total"
    ).textContent = total;
}

function deleteItem(index) {

    items.splice(index, 1);

    render();
}

function exportTXT() {
    const groups = {
        1: [],
        2: [],
        3: [],
        4: [],
        missing: []
    };

    const tierTotals = {
        1: 0,
        2: 0,
        3: 0,
        4: 0
    };

    let grandTotal = 0;

    items.forEach(item => {

        const result =
            calculate(item);

        if(item.missing){

            groups.missing.push(
                `${item.id} ${item.name}`
            );

        } else {

            tierTotals[item.tier] += result;

            grandTotal += result;

            const tierValue = tierPrices[item.tier];
const lvlMulti = getLevelMultiplier(item.lvl);
const legaMulti = legaMultipliers[item.lega];

let formula = "";

if(item.lega > 0){

formula =
`${item.id} ${item.name} (${item.es} * ${tierValue}m * ${legaMulti}) * ${lvlMulti} = ${result}m`;

}else{

formula =
`${item.id} ${item.name} (${item.es} * ${tierValue}m) * ${lvlMulti} = ${result}m`;

}

groups[item.tier].push(formula);

        }
    });

    let txt =
        "Lista przedmiotów\n\n";

    for (
        let tier = 1;
        tier <= 4;
        tier++
    ) {

        txt +=
            `Tier ${tier} - `
            + tierTotals[tier]
            + `m\n\n`;

        groups[tier]
            .forEach(line => {

                txt +=
                    line + "\n";

            });

        txt += "\n";
    }
    txt +=
        "Pozostałe Itemy:\n\n";

    groups.missing.forEach(line => {
        txt += line + "\n";
    });

    txt += "\n";
    txt +=
        "SUMA CAŁOŚCI: "
        + grandTotal
        + "m";

    const blob =
        new Blob(
            [txt],
            {
                type:
                "text/plain;charset=utf-8"
            }
        );

    const link =
        document.createElement("a");

    link.href =
        URL.createObjectURL(blob);

    link.download =
        "wycena.txt";

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);
}