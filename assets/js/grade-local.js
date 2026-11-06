(function (global) {
    function getStorageKey(semestre) {
        return 'owltime_simulacao_painel_' + (semestre || 'default');
    }

    function loadState(semestre) {
        const raw = localStorage.getItem(getStorageKey(semestre));
        const defaults = {
            activeTurmaId: '',
            assignments: [],
            lastGenerationReport: null,
            qdpInfo: null,
            metodo: null
        };
        if (!raw) return defaults;
        let parsed;
        try {
            parsed = JSON.parse(raw);
        } catch (error) {
            throw new Error('A grade salva para "' + (semestre || 'default') + '" não contém JSON válido.');
        }
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
            throw new Error('A grade salva não tem o formato esperado.');
        }
        if (parsed.assignments != null && !Array.isArray(parsed.assignments)) {
            throw new Error('A lista de aulas da grade salva não tem o formato esperado.');
        }
        return Object.assign({}, defaults, parsed, {
            assignments: Array.isArray(parsed.assignments) ? parsed.assignments : []
        });
    }

    function summarizeAssignments(assignments, professores, turmas, disciplinas) {
        const professorMap = Object.fromEntries((professores || []).map(p => [String(p.id), p]));
        const turmaMap = Object.fromEntries((turmas || []).map(t => [String(t.id), t]));
        const disciplinaMap = Object.fromEntries((disciplinas || []).map(d => [String(d.id), d]));
        const porProfessor = {};
        const porTurma = {};
        const porDisciplina = {};

        (assignments || []).forEach(item => {
            const professorId = String(item.professor_id || '');
            const turmaId = String(item.turma_id || '');
            const disciplinaId = String(item.disciplina_id || '');

            if (professorId) {
                if (!porProfessor[professorId]) {
                    porProfessor[professorId] = { id: professorId, nome: professorMap[professorId]?.nome || 'Professor', total: 0 };
                }
                porProfessor[professorId].total += 1;
            }

            if (turmaId) {
                if (!porTurma[turmaId]) {
                    porTurma[turmaId] = { id: turmaId, nome: turmaMap[turmaId]?.nome || 'Turma', total: 0 };
                }
                porTurma[turmaId].total += 1;
            }

            if (disciplinaId) {
                if (!porDisciplina[disciplinaId]) {
                    porDisciplina[disciplinaId] = { id: disciplinaId, nome: disciplinaMap[disciplinaId]?.nome || 'Disciplina', total: 0 };
                }
                porDisciplina[disciplinaId].total += 1;
            }
        });

        return {
            total: (assignments || []).length,
            porProfessor: Object.values(porProfessor).sort((a, b) => b.total - a.total),
            porTurma: Object.values(porTurma).sort((a, b) => b.total - a.total),
            porDisciplina: Object.values(porDisciplina).sort((a, b) => b.total - a.total)
        };
    }

    global.OwltimeGradeLocal = {
        loadState: loadState,
        summarizeAssignments: summarizeAssignments,
        getStorageKey: getStorageKey
    };
})(window);
