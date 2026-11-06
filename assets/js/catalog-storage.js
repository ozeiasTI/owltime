(function (global) {
    function getModuleKey(moduleKey) {
        return moduleKey;
    }

    function readRaw(moduleKey) {
        const raw = localStorage.getItem(getModuleKey(moduleKey));
        if (raw === null) return undefined;
        try {
            return JSON.parse(raw);
        } catch (error) {
            throw new Error('Os dados locais de "' + moduleKey + '" não contêm JSON válido.');
        }
    }

    function extractRecords(moduleKey) {
        const parsed = readRaw(moduleKey);
        if (parsed === undefined) return [];
        if (Array.isArray(parsed)) {
            return parsed;
        }
        if (parsed && Array.isArray(parsed.records)) {
            return parsed.records;
        }
        throw new Error('Os dados locais de "' + moduleKey + '" não têm uma lista de registros reconhecida.');
    }

    function saveRecords(moduleKey, records, meta) {
        if (!Array.isArray(records)) {
            throw new TypeError('Os registros de "' + moduleKey + '" precisam ser uma lista.');
        }
        const payload = {
            module: meta && meta.module ? meta.module : moduleKey,
            storageKey: getModuleKey(moduleKey),
            version: meta && meta.version ? meta.version : 1,
            generatedAt: meta && meta.generatedAt ? meta.generatedAt : new Date().toISOString(),
            semestre: meta && meta.semestre ? meta.semestre : '',
            records: records
        };
        localStorage.setItem(getModuleKey(moduleKey), JSON.stringify(payload));
        return payload.records;
    }

    function upsertRecord(moduleKey, record) {
        if (!record || typeof record !== 'object' || Array.isArray(record)) {
            throw new TypeError('O registro a salvar precisa ser um objeto.');
        }
        const records = extractRecords(moduleKey).slice();
        const currentId = String(record && record.id ? record.id : '');
        let updated = false;

        if (currentId) {
            for (let i = 0; i < records.length; i++) {
                if (String(records[i].id) === currentId) {
                    records[i] = Object.assign({}, records[i], record);
                    updated = true;
                    break;
                }
            }
        }

        if (!updated) {
            records.push(record);
        }

        saveRecords(moduleKey, records);
        return records;
    }

    function deleteRecord(moduleKey, id) {
        const records = extractRecords(moduleKey).filter(function (record) {
            return String(record.id) !== String(id);
        });
        saveRecords(moduleKey, records);
        return records;
    }

    function nextId(moduleKey) {
        const records = extractRecords(moduleKey);
        let maxId = 0;
        records.forEach(function (record) {
            const id = parseInt(record.id, 10);
            if (Number.isFinite(id) && id > maxId) {
                maxId = id;
            }
        });
        return maxId + 1;
    }

    global.OwltimeCatalogStorage = {
        readRaw: readRaw,
        extractRecords: extractRecords,
        saveRecords: saveRecords,
        upsertRecord: upsertRecord,
        deleteRecord: deleteRecord,
        nextId: nextId
    };
})(window);