(function () {
    'use strict';

    const KEYS = {
        cursos: 'owltime_cursos_v1',
        professores: 'owltime_professores_v1',
        disciplinas: 'owltime_disciplinas_v1',
        turmas: 'owltime_turmas_v1',
        horarios: 'owltime_horarios_v1',
        vinculos: 'owltime_professor_disciplina_v1',
        disponibilidade: 'owltime_professor_disponibilidade_v1',
        demandas: 'owltime_turma_disciplina_v1',
        substituicoes: 'owltime_substituicoes_docentes_v1',
        peculiaridades: 'owltime_peculiaridades_v1',
        protecoesGrade: 'owltime_protecoes_grade_v1',
        eventos: 'owltime_eventos_v1',
        eventosGrade: 'owltime_eventos_grade_v1',
        notas: 'owltime_notas_v1',
        semestre: 'owltime_semestre_atual'
    };
    const WEEKDAYS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];
    const DAYS = WEEKDAYS.concat(['Sábado', 'Domingo']);
    const PERIODOS = ['Matutino', 'Vespertino', 'Integral', 'Noturno', 'EAD'];
    const SUBJECT_COLORS = ['#dceeff', '#fce4ec', '#e4f4e8', '#fff0d6', '#ece5ff', '#dff5f3', '#f7e8d8', '#e7eafc', '#f3e5f5', '#e8f0df', '#ffe8dc', '#dcecf2'];
    const DECLARATION_INSTITUTION_KEY = 'owltime_declaracao_instituicao_v1';
    const TUTORIAL_STORAGE_KEY = 'owltime_tutorial_state';
    const PLAIN_TEXT_PREFERENCE_KEYS = ['owltime_fixture_profile_id', KEYS.semestre, DECLARATION_INSTITUTION_KEY];
    const TUTORIAL_STEPS = [
        {
            route: 'cursos', title: 'Cadastre o curso', description: 'Crie o curso fictício que será usado nas demais etapas.',
            instructions: ['Abra o formulário “Novo registro” e preencha Nome e Sigla; mantenha o status Ativo.', 'Salve o curso antes de seguir: as próximas etapas precisam dele para associar disciplinas e turmas.', 'Confira se “Tecnologia em Gestão Pública” aparece na tabela de registros.'],
            values: [['Nome', 'Tecnologia em Gestão Pública'], ['Sigla', 'TGP'], ['Status', 'Ativo']]
        },
        {
            route: 'disciplinas', title: 'Cadastre as disciplinas', description: 'Selecione o curso criado na etapa anterior para cada disciplina.',
            instructions: ['Cadastre Políticas Públicas e Administração Pública como dois registros separados.', 'Em cada cadastro, selecione Tecnologia em Gestão Pública no campo Curso e mantenha o status Ativa.', 'Se o curso ainda não aparecer na lista, volte a Cursos e conclua o cadastro.'],
            values: [['Disciplina 1', 'Políticas Públicas'], ['Disciplina 2', 'Administração Pública'], ['Curso', 'Tecnologia em Gestão Pública · selecione na lista']]
        },
        {
            route: 'professores', title: 'Cadastre os professores', description: 'Use os valores fictícios nos campos de texto; escolha titulação e status nos menus.',
            instructions: ['Cadastre Ana e Bruno em registros separados; disciplina de ingresso é texto livre, não é um vínculo.', 'Use uma titulação disponível na lista, informe carga e limite diário e mantenha os dois como Ativos.', 'Confira a lista depois de salvar cada professor; os vínculos por semestre serão feitos mais adiante.'],
            values: [['Professora 1', 'Ana Exemplo'], ['Ingresso 1', 'Políticas públicas'], ['Professor 2', 'Bruno Exemplo'], ['Ingresso 2', 'Gestão administrativa'], ['Carga semanal', '20'], ['Limite diário', '4']]
        },
        {
            route: 'turmas', title: 'Cadastre a turma', description: 'Associe a turma ao curso e ao semestre usado neste tutorial.',
            instructions: ['Crie uma turma ativa, selecione o curso e o turno Noturno.', 'Informe ano letivo 2026 e semestre letivo 2026/2 para manter a turma alinhada com demandas e vínculos.', 'A turma salva será selecionada nas etapas de demandas e grade.'],
            values: [['Turma', '1º semestre - demonstração'], ['Ano letivo', '2026'], ['Período/turno', 'Noturno'], ['Semestre', '2026/2'], ['Curso', 'Tecnologia em Gestão Pública · selecione na lista']]
        },
        {
            route: 'horarios', title: 'Configure os horários', description: 'Cadastre os períodos da segunda-feira. Depois use “Duplicar horários de um dia” para copiar para terça a sexta.',
            instructions: ['Crie dois períodos do tipo Aula e um período do tipo Intervalo, sem sobreposição.', 'Use a ferramenta de duplicação para copiar os períodos de segunda para terça, quarta, quinta e sexta.', 'Verifique o resumo semanal: devem existir dez períodos de aula disponíveis para a turma.'],
            values: [['Segunda · aula 1', '18:30–19:20'], ['Segunda · intervalo', '19:20–19:30'], ['Segunda · aula 2', '19:30–20:20'], ['Duplicar para', 'Terça, Quarta, Quinta e Sexta']]
        },
        {
            route: 'demandas', title: 'Informe as demandas', description: 'Crie as demandas para a turma de demonstração e use o semestre 2026/2.',
            instructions: ['Selecione a turma de demonstração e cadastre uma demanda para cada disciplina.', 'Defina cinco aulas semanais por disciplina e semestre 2026/2 (dez aulas no total).', 'Confira os registros para confirmar que turma, disciplina e semestre estão corretos antes de vincular professores.'],
            values: [['Demanda 1', 'Políticas Públicas · 5 aulas semanais'], ['Demanda 2', 'Administração Pública · 5 aulas semanais'], ['Semestre', '2026/2'], ['Turma', '1º semestre - demonstração · selecione na lista']]
        },
        {
            route: 'vinculos', title: 'Vincule professores', description: 'Selecione o curso e o semestre 2026/2; associe cada professor à sua disciplina.',
            instructions: ['Filtre primeiro pelo curso Tecnologia em Gestão Pública e pelo semestre 2026/2.', 'Crie o vínculo de Ana com Políticas Públicas e de Bruno com Administração Pública.', 'Confira a cobertura: as disciplinas demandadas devem ter professor e os dois professores devem aparecer vinculados.'],
            values: [['Vínculo 1', 'Ana Exemplo → Políticas Públicas'], ['Vínculo 2', 'Bruno Exemplo → Administração Pública'], ['Semestre', '2026/2'], ['Curso', 'Tecnologia em Gestão Pública · selecione na lista']]
        },
        {
            route: 'disponibilidade', title: 'Consulte PRD e disponibilidade', description: 'Selecione semestre e curso. O PRD é opcional; se quiser testar, escolha um dia sem aulas cadastradas.',
            instructions: ['Selecione 2026/2 e o curso para consultar os professores relacionados às demandas.', 'PRD bloqueia o dia inteiro; use apenas se houver um dia reservado a outras atividades docentes.', 'Neste exemplo, o Domingo não tem períodos de aula, então o PRD é opcional e não interfere na geração.'],
            values: [['Semestre', '2026/2'], ['Curso', 'Tecnologia em Gestão Pública · selecione na lista'], ['Dia de exemplo', 'Domingo · sem horários de aula cadastrados']]
        },
        {
            route: 'grade', title: 'Gere a grade', description: 'Confirme o semestre e gere a proposta automática. As dez aulas demandadas cabem nos dez períodos semanais configurados.',
            instructions: ['Confirme que existem demandas, vínculos e períodos de aula para o semestre 2026/2.', 'Gere a grade automática e leia o resumo: compare aulas previstas, preenchidas e pendentes.', 'A geração pode ser repetida; revise o resultado antes de compartilhar ou exportar os horários.'],
            values: [['Semestre', '2026/2'], ['Aulas previstas', '10 (5 por disciplina)'], ['Professores', 'Ana Exemplo e Bruno Exemplo']]
        },
        {
            route: 'ajustes', title: 'Revise os ajustes manuais', description: 'Confira as aulas, abra uma turma e veja os períodos vazios. Não é necessário alterar a grade para avançar.',
            instructions: ['Escolha a turma para ver sua grade e comparar as aulas alocadas com as demandas.', 'Clique em uma aula para editar; em modo de ajustes, também é possível arrastar uma aula para um período vazio.', 'Só salve mudanças necessárias: qualquer edição atualiza a grade deste semestre no navegador.'],
            values: [['Turma', '1º semestre - demonstração'], ['Verifique', 'Professor, disciplina, dia e horário de cada aula']]
        },
        {
            route: 'relatorios', title: 'Confira relatórios', description: 'Veja a cobertura por turma, a distribuição de aulas e exporte o relatório para PDF ou CSV.',
            instructions: ['Selecione 2026/2 para ver os indicadores do semestre trabalhado.', 'Confira aulas preenchidas e previstas, disciplinas e professores por turma.', 'O relatório ajuda a detectar pendências antes da distribuição da grade.'],
            values: [['Semestre', '2026/2'], ['Resultado esperado', '10 aulas previstas e até 10 preenchidas']]
        }
    ];
    const view = document.getElementById('view');
    const alertBox = document.getElementById('app-alert');
    let editing = null;
    let gradeEditingId = null;
    let gradeFocusDay = '';
    let gradeFocusSlotId = '';
    let gradeDisciplineFilter = '';
    let gradeTurmaFilter = '';
    let gradeTeacherFilter = '';
    let gradeCompletionFilter = '';
    let gradeAllClassesCollapsed = false;
    let teacherSubstitutionEditingId = '';
    let coverageCourseId = '';
    let availabilityCourseId = '';
    let reportSearchQuery = '';
    let reportCourseFilter = '';
    let reportTeacherFilter = '';
    let reportTurmaFilter = '';
    let reportDisciplineFilter = '';
    let reportMinimumLessons = '';
    let reportMaximumLessons = '';
    let pdfExportType = 'turma';
    let pdfExportId = '';
    let availabilitySemester = getSemester();
    let catalogImport = null;
    let spreadsheetImport = null;
    let alertTimer = 0;
    let generationSummaryTimer = 0;
    let qdpGenerationInProgress = false;
    let qdpProcessingTimer = 0;
    const catalogImportSchemas = {
        cursos: {
            filename: 'modelo_cursos.csv',
            headers: ['ID', 'Nome', 'Sigla', 'Status'],
            aliases: { id: ['id'], nome: ['nome'], sigla: ['sigla'], status: ['status'] }
        },
        professores: {
            filename: 'modelo_professores.csv',
            headers: ['ID', 'Nome', 'Disciplina de ingresso', 'Matrícula', 'E-mail', 'Telefone', 'Titulação', 'Carga semanal (aulas)', 'Limite de aulas por dia', 'Status'],
            aliases: {
                id: ['id'], nome: ['nome'], disciplina_ingresso: ['disciplina_de_ingresso', 'disciplina_ingresso'],
                matricula: ['matricula'], email: ['email', 'e_mail'],
                telefone: ['telefone', 'celular'], titulacao: ['titulacao'],
                carga_horaria_semanal: ['carga_semanal_aulas', 'carga_horaria_semanal', 'carga_semanal'],
                limite_aulas_dia: ['limite_de_aulas_por_dia', 'limite_aulas_dia'], status: ['status']
            }
        },
        disciplinas: {
            filename: 'modelo_disciplinas.csv',
            headers: ['ID', 'Nome', 'Curso', 'Status'],
            aliases: { id: ['id'], nome: ['nome'], curso_nome: ['curso', 'curso_nome', 'nome_do_curso'], status: ['status'] }
        },
        turmas: {
            filename: 'modelo_turmas.csv',
            headers: ['ID', 'Nome da turma', 'Curso', 'Ano letivo', 'Período/turno', 'Semestre letivo', 'Status'],
            aliases: {
                id: ['id'],
                nome: ['nome_da_turma', 'nome', 'turma'],
                curso_nome: ['curso', 'curso_nome', 'nome_do_curso'],
                ano_letivo: ['ano_letivo', 'ano'], periodo: ['periodo_turno', 'periodo', 'turno'],
                semestre_letivo: ['semestre_letivo', 'semestre'], status: ['status']
            }
        }
    };

    function h(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function notify(message, type) {
        alertBox.className = 'alert alert-' + (type || 'info');
        alertBox.textContent = message;
        window.clearTimeout(alertTimer);
        alertTimer = window.setTimeout(function () {
            alertBox.classList.add('d-none');
        }, 6500);
    }

    function readTutorialState() {
        const raw = sessionStorage.getItem(TUTORIAL_STORAGE_KEY);
        if (!raw) return null;
        const state = JSON.parse(raw);
        if (!state || !Number.isInteger(state.step) || state.step < 0 || state.step >= TUTORIAL_STEPS.length) {
            throw new Error('O estado do tutorial está inválido. Encerre o tutorial e inicie novamente.');
        }
        return state;
    }

    function saveTutorialState(state) {
        sessionStorage.setItem(TUTORIAL_STORAGE_KEY, JSON.stringify(state));
    }

    function clearTutorialState() {
        sessionStorage.removeItem(TUTORIAL_STORAGE_KEY);
    }

    function renderTutorialGuide(route) {
        const banner = document.getElementById('tutorial-environment-banner');
        const previousGuide = document.getElementById('tutorial-guide');
        if (previousGuide) previousGuide.remove();
        let state;
        try {
            state = readTutorialState();
        } catch (error) {
            console.error('Falha ao carregar o estado do tutorial:', error);
            clearTutorialState();
            if (banner) banner.hidden = true;
            notify(error.message, 'danger');
            return;
        }
        if (banner) banner.hidden = !state;
        if (!state) return;

        const currentRouteIndex = TUTORIAL_STEPS.findIndex(function (item) { return item.route === route; });
        if (currentRouteIndex >= 0 && currentRouteIndex !== state.step) {
            state.step = currentRouteIndex;
            saveTutorialState(state);
        }
        const step = TUTORIAL_STEPS[state.step];
        const onStepPage = currentRouteIndex === state.step;
        const minimized = Boolean(state.minimized);
        const values = onStepPage ? step.values.map(function (item) {
            return '<li><span><small>' + h(item[0]) + '</small><code>' + h(item[1]) + '</code></span>' +
                '<button type="button" class="btn btn-sm btn-light" data-action="copy-tutorial-value" data-copy-value="' +
                h(item[1]) + '" aria-label="Copiar ' + h(item[0]) + '"><i class="bi bi-clipboard"></i><span>Copiar</span></button></li>';
        }).join('') : '';
        const guide = document.createElement('aside');
        guide.id = 'tutorial-guide';
        guide.className = 'tutorial-guide';
        guide.setAttribute('role', 'region');
        guide.setAttribute('aria-label', 'Tutorial guiado');
        guide.innerHTML = '<header class="tutorial-guide-drag-handle"><div><span class="tutorial-guide-kicker">TUTORIAL GUIADO · PASSO ' +
            (state.step + 1) + ' DE ' + TUTORIAL_STEPS.length + '</span><h2>' + h(step.title) + '</h2></div>' +
            '<div class="tutorial-guide-controls"><button type="button" class="btn btn-sm btn-light" data-action="toggle-tutorial-minimize" aria-label="' +
                (minimized ? 'Expandir tutorial' : 'Minimizar tutorial') + '" title="' + (minimized ? 'Expandir' : 'Minimizar') +
                '"><i class="bi ' + (minimized ? 'bi-arrows-angle-expand' : 'bi-dash-lg') + '"></i></button>' +
            '<button type="button" class="btn btn-sm btn-light" data-action="stop-tutorial" aria-label="Encerrar tutorial" title="Encerrar tutorial"><i class="bi bi-x-lg"></i></button></div></header>' +
            (minimized ? '' :
                '<div class="tutorial-guide-progress" role="progressbar" aria-valuenow="' + Math.round((state.step + 1) / TUTORIAL_STEPS.length * 100) +
                '" aria-valuemin="0" aria-valuemax="100"><span style="width:' + Math.round((state.step + 1) / TUTORIAL_STEPS.length * 100) + '%"></span></div>' +
                '<div class="tutorial-guide-body">' + (onStepPage
                    ? '<p>' + h(step.description) + '</p><h3>O que fazer nesta etapa</h3><ol class="tutorial-guide-instructions">' +
                        step.instructions.map(function (instruction) { return '<li>' + h(instruction) + '</li>'; }).join('') +
                        '</ol><p class="tutorial-guide-hint"><i class="bi bi-info-circle"></i>Preencha os campos manualmente; use “Copiar” e cole com Ctrl+V. O tutorial não cria nem remove cadastros.</p>' +
                        '<ul class="tutorial-guide-values">' + values + '</ul>'
                    : '<p>Esta etapa é feita em <strong>' + h(step.route === 'ajustes' ? 'Ajustes manuais' : step.route) +
                        '</strong>. Você pode continuar navegando; as orientações e os exemplos desta etapa aparecerão quando chegar à página correspondente.</p>') +
                '</div><footer>' + (onStepPage
                ? '<button type="button" class="btn btn-primary btn-sm" data-action="next-tutorial-step">' +
                    (state.step === TUTORIAL_STEPS.length - 1 ? 'Finalizar tutorial' : 'Próxima etapa') +
                    '<i class="bi bi-arrow-right ms-1"></i></button>'
                : '<button type="button" class="btn btn-primary btn-sm" data-action="go-tutorial-step">Abrir esta etapa<i class="bi bi-arrow-right ms-1"></i></button>') +
                '<span>Os exemplos são fictícios.</span></footer>');
        document.body.appendChild(guide);
        if (Number.isFinite(state.x) && Number.isFinite(state.y)) {
            guide.style.left = Math.max(0, Math.min(state.x, window.innerWidth - guide.offsetWidth)) + 'px';
            guide.style.top = Math.max(0, Math.min(state.y, window.innerHeight - guide.offsetHeight)) + 'px';
            guide.style.right = 'auto';
            guide.style.bottom = 'auto';
        }
        attachTutorialDrag(guide);
    }

    function attachTutorialDrag(guide) {
        const handle = guide.querySelector('.tutorial-guide-drag-handle');
        if (!handle) return;
        handle.addEventListener('pointerdown', function (event) {
            if (event.target.closest('button') || (event.pointerType === 'mouse' && event.button !== 0)) return;
            event.preventDefault();
            const rect = guide.getBoundingClientRect();
            const offsetX = event.clientX - rect.left;
            const offsetY = event.clientY - rect.top;
            guide.style.left = rect.left + 'px';
            guide.style.top = rect.top + 'px';
            guide.style.right = 'auto';
            guide.style.bottom = 'auto';
            const move = function (moveEvent) {
                const left = Math.max(0, Math.min(moveEvent.clientX - offsetX, window.innerWidth - guide.offsetWidth));
                const top = Math.max(0, Math.min(moveEvent.clientY - offsetY, window.innerHeight - guide.offsetHeight));
                guide.style.left = left + 'px';
                guide.style.top = top + 'px';
            };
            const finish = function () {
                document.removeEventListener('pointermove', move);
                document.removeEventListener('pointerup', finish);
                document.removeEventListener('pointercancel', finish);
                const current = readTutorialState();
                if (!current) return;
                const finalRect = guide.getBoundingClientRect();
                saveTutorialState(Object.assign({}, current, { x: finalRect.left, y: finalRect.top }));
            };
            document.addEventListener('pointermove', move);
            document.addEventListener('pointerup', finish, { once: true });
            document.addEventListener('pointercancel', finish, { once: true });
        });
    }

    function copyTutorialValue(value) {
        if (navigator.clipboard && window.isSecureContext) {
            return navigator.clipboard.writeText(value);
        }
        const field = document.createElement('textarea');
        field.value = value;
        field.setAttribute('readonly', '');
        field.style.position = 'fixed';
        field.style.opacity = '0';
        document.body.appendChild(field);
        let copied = false;
        try {
            field.select();
            copied = document.execCommand('copy');
        } finally {
            field.remove();
        }
        if (!copied) throw new Error('Não foi possível copiar este valor. Selecione-o e copie manualmente.');
        return Promise.resolve();
    }

    function readRecords(key) {
        if (!window.OwltimeCatalogStorage) throw new Error('O armazenamento local não foi carregado. Atualize a página e tente novamente.');
        return window.OwltimeCatalogStorage.extractRecords(key);
    }

    function saveRecords(key, records, moduleName) {
        if (!window.OwltimeCatalogStorage) throw new Error('O armazenamento local não foi carregado. Atualize a página e tente novamente.');
        window.OwltimeCatalogStorage.saveRecords(key, records, { module: moduleName || key, semestre: getSemester() });
    }

    function getSemester() {
        const stored = localStorage.getItem(KEYS.semestre);
        if (stored && /^\d{4}\/[12]$/.test(stored)) return stored;
        const now = new Date();
        return now.getFullYear() + '/' + (now.getMonth() < 6 ? '1' : '2');
    }

    function setSemester(value) {
        const semester = String(value || '').trim();
        if (!/^\d{4}\/[12]$/.test(semester)) throw new Error('Informe o semestre no formato AAAA/1 ou AAAA/2.');
        localStorage.setItem(KEYS.semestre, semester);
        return semester;
    }

    function nextId(records) {
        return records.reduce(function (max, record) {
            const id = Number.parseInt(record.id, 10);
            return Number.isFinite(id) && id > max ? id : max;
        }, 0) + 1;
    }

    function activeRecords(key, statusValues) {
        return readRecords(key).filter(function (record) {
            return !record.status || statusValues.includes(String(record.status).toLowerCase());
        });
    }

    function findById(key, id) {
        return readRecords(key).find(function (record) {
            return String(record.id) === String(id);
        });
    }

    function nameById(key, id, fallback) {
        const record = findById(key, id);
        return record ? record.nome : (fallback || '—');
    }

    function teacherIngressName(teacher) {
        return teacher.disciplina_ingresso ||
            (teacher.disciplina_ingresso_id ? nameById(KEYS.disciplinas, teacher.disciplina_ingresso_id, '') : '');
    }

    function scheduleDays(slots) {
        return WEEKDAYS.concat(DAYS.slice(5).filter(function (day) {
            return slots.some(function (slot) {
                return slot.dia_semana === day && String(slot.tipo || 'Aula').toLowerCase() === 'aula';
            });
        }));
    }

    function statusBadge(value) {
        const active = ['ativo', 'ativa', 'sim', 'andamento'].includes(String(value || '').toLowerCase());
        const done = ['concluido', 'concluída', 'concluida'].includes(String(value || '').toLowerCase());
        return '<span class="badge text-bg-' + (done ? 'success' : active ? 'primary' : 'secondary') + '">' + h(value || '—') + '</span>';
    }

    function scheduleTypeBadge(value) {
        const isClass = String(value || 'Aula').toLocaleLowerCase('pt-BR') === 'aula';
        const label = isClass ? 'Aula' : 'Intervalo';
        return '<span class="schedule-type-badge schedule-type-' + (isClass ? 'class' : 'break') + '">' + h(label) + '</span>';
    }

    function demandQuantityBadge(value) {
        const count = Number(value) || 0;
        const level = count <= 2 ? 'low' : count <= 4 ? 'medium' : 'high';
        return '<span class="demand-count demand-count-' + level + '">' + h(count) + ' aula(s)</span>';
    }

    function semesterMatches(record, semester) {
        const value = String(record.semestre_letivo || record.semestre || '').trim();
        const selectedSemester = typeof semester === 'string' && semester ? semester : getSemester();
        return !value || value === selectedSemester;
    }

    function getDemandsForClass(classId, semester) {
        const relations = readRecords(KEYS.demandas).filter(function (row) {
            return String(row.turma_id) === String(classId) && semesterMatches(row, semester);
        });
        if (relations.length) {
            return relations.map(function (row) {
                return {
                    disciplina_id: Number(row.disciplina_id),
                    disciplina_nome: nameById(KEYS.disciplinas, row.disciplina_id, row.disciplina_nome),
                    aulas_semanais: Number(row.aulas_semanais || row.aulas_previstas || 0)
                };
            }).filter(function (row) { return row.disciplina_id && row.aulas_semanais > 0; });
        }
        const turma = findById(KEYS.turmas, classId);
        const matrix = turma && Array.isArray(turma.matriz) ? turma.matriz : [];
        return matrix.map(function (row) {
            return {
                disciplina_id: Number(row.disciplina_id),
                disciplina_nome: nameById(KEYS.disciplinas, row.disciplina_id, row.disciplina_nome),
                aulas_semanais: Number(row.aulas_semanais || row.aulas_previstas || 0)
            };
        }).filter(function (row) { return row.disciplina_id && row.aulas_semanais > 0; });
    }

    const specs = {
        cursos: {
            title: 'Cursos', icon: 'bi-mortarboard', key: KEYS.cursos, module: 'Cursos',
            fields: [
                { name: 'nome', label: 'Nome', required: true },
                { name: 'sigla', label: 'Sigla', placeholder: 'Ex.: EF II' },
                { name: 'status', label: 'Status', type: 'select', defaultValue: 'Ativo', options: [['Ativo', 'Ativo'], ['Inativo', 'Inativo']] }
            ],
            columns: [
                ['nome', 'Nome'], ['sigla', 'Sigla'], ['status', 'Status', statusBadge]
            ]
        },
        professores: {
            title: 'Professores', icon: 'bi-person-workspace', key: KEYS.professores, module: 'Professores',
            fields: [
                { name: 'nome', label: 'Nome', required: true },
                { name: 'disciplina_ingresso', label: 'Disciplina de ingresso', placeholder: 'Ex.: área ou especialidade do concurso' },
                { name: 'matricula', label: 'Matrícula' },
                { name: 'email', label: 'E-mail', type: 'email' },
                { name: 'telefone', label: 'Telefone', type: 'tel' },
                { name: 'titulacao', label: 'Titulação' },
                { name: 'carga_horaria_semanal', label: 'Carga semanal (aulas)', type: 'number', min: 0, defaultValue: 40 },
                { name: 'limite_aulas_dia', label: 'Limite de aulas por dia', type: 'number', min: 0, defaultValue: 5 },
                { name: 'status', label: 'Status', type: 'select', defaultValue: 'Ativo', options: [['Ativo', 'Ativo'], ['Inativo', 'Inativo']] }
            ],
            columns: [
                ['nome', 'Professor', function (value, record) {
                    const discipline = record.disciplina_ingresso || (record.disciplina_ingresso_id ? nameById(KEYS.disciplinas, record.disciplina_ingresso_id, '') : '');
                    return '<strong>' + h(value) + '</strong>' + (discipline ? '<div class="small text-muted">Ingresso: ' + h(discipline) + '</div>' : '');
                }],
                ['matricula', 'Matrícula'], ['telefone', 'Telefone'],
                ['carga_horaria_semanal', 'Carga/semana'], ['status', 'Status', statusBadge]
            ]
        },
        disciplinas: {
            title: 'Disciplinas', icon: 'bi-book', key: KEYS.disciplinas, module: 'Disciplinas',
            fields: [
                { name: 'nome', label: 'Nome', required: true },
                { name: 'curso_id', label: 'Curso', type: 'select', optionsFrom: 'cursos', optional: true },
                { name: 'status', label: 'Status', type: 'select', defaultValue: 'Ativa', options: [['Ativa', 'Ativa'], ['Inativa', 'Inativa']] }
            ],
            columns: [
                ['nome', 'Disciplina'], ['curso_nome', 'Curso'], ['status', 'Status', statusBadge]
            ]
        },
        turmas: {
            title: 'Turmas', icon: 'bi-people', key: KEYS.turmas, module: 'Turmas',
            fields: [
                { name: 'nome', label: 'Nome da turma', required: true },
                { name: 'curso_id', label: 'Curso', type: 'select', optionsFrom: 'cursos', optional: true },
                { name: 'ano_letivo', label: 'Ano letivo', type: 'number', min: 2000, defaultValue: new Date().getFullYear() },
                { name: 'periodo', label: 'Período/turno', type: 'select', optional: true, options: PERIODOS.map(function (period) { return [period, period]; }) },
                { name: 'semestre_letivo', label: 'Semestre letivo', defaultValue: getSemester(), placeholder: 'AAAA/1' },
                { name: 'status', label: 'Status', type: 'select', defaultValue: 'Ativa', options: [['Ativa', 'Ativa'], ['Inativa', 'Inativa']] }
            ],
            columns: [
                ['nome', 'Turma'], ['curso_nome', 'Curso'],
                ['periodo', 'Período', function (value) {
                    if (!value) return '<span class="turno-badge turno-indefinido">Não informado</span>';
                    const className = 'turno-' + normalizeCatalogValue(value).replace(/[^a-z0-9]+/g, '-');
                    return '<span class="turno-badge ' + h(className) + '">' + h(value) + '</span>';
                }],
                ['semestre_letivo', 'Semestre'], ['status', 'Status', statusBadge]
            ]
        },
        horarios: {
            title: 'Horários da escola', icon: 'bi-clock', key: KEYS.horarios, module: 'Horarios',
            fields: [
                { name: 'dia_semana', label: 'Dia da semana', type: 'select', required: true, options: DAYS.map(function (day) { return [day, day]; }) },
                { name: 'hora_inicio', label: 'Início', type: 'time', required: true },
                { name: 'hora_fim', label: 'Fim', type: 'time', required: true },
                { name: 'tipo', label: 'Tipo', type: 'select', defaultValue: 'Aula', options: [['Aula', 'Aula'], ['Intervalo', 'Intervalo']] }
            ],
            columns: [
                ['dia_semana', 'Dia'], ['hora_inicio', 'Início'], ['hora_fim', 'Fim'], ['tipo', 'Tipo', scheduleTypeBadge]
            ]
        },
        vinculos: {
            title: 'Vínculos professor × disciplina', icon: 'bi-link-45deg', key: KEYS.vinculos, module: 'ProfessorDisciplina',
            fields: [
                { name: 'professor_id', label: 'Professor', type: 'select', optionsFrom: 'professores', includeIngress: true, required: true },
                { name: 'disciplina_id', label: 'Disciplina', type: 'select', optionsFrom: 'disciplinas', required: true },
                { name: 'semestre_letivo', label: 'Semestre letivo', defaultValue: getSemester(), placeholder: 'AAAA/1' }
            ],
            columns: [
                ['professor_id', 'Professor', function (id) {
                    const teacher = findById(KEYS.professores, id);
                    const name = teacher ? teacher.nome : nameById(KEYS.professores, id);
                    const ingress = teacher ? teacherIngressName(teacher) : '';
                    return h(name) + (ingress ? '<small class="d-block text-muted">Ingresso: ' + h(ingress) + '</small>' : '');
                }],
                ['disciplina_id', 'Disciplina', function (id) { return h(nameById(KEYS.disciplinas, id)); }],
                ['semestre_letivo', 'Semestre']
            ]
        },
        disponibilidade: {
            title: 'PRD e disponibilidade dos professores', icon: 'bi-calendar2-check', key: KEYS.disponibilidade, module: 'ProfessorDisponibilidade',
            fields: [
                { name: 'professor_id', label: 'Professor', type: 'select', optionsFrom: 'professores', required: true },
                { name: 'dia_semana', label: 'Dia', type: 'select', required: true, options: DAYS.map(function (day) { return [day, day]; }) },
                { name: 'tipo', label: 'Registro', type: 'select', defaultValue: 'indisponibilidade', options: [['indisponibilidade', 'Indisponibilidade'], ['prd', 'PRD · dia todo sem aulas']] },
                { name: 'horario_id', label: 'Horário (vazio = dia todo)', type: 'select', optionsFrom: 'horarios', optional: true },
                { name: 'disponivel', label: 'Situação', type: 'select', defaultValue: '0', options: [['0', 'Indisponível'], ['1', 'Disponível']] },
                { name: 'semestre_letivo', label: 'Semestre letivo', defaultValue: getSemester(), placeholder: 'AAAA/1' }
            ],
            columns: [
                ['professor_id', 'Professor', function (id) { return h(nameById(KEYS.professores, id)); }],
                ['dia_semana', 'Dia'],
                ['tipo', 'Registro', function (value) {
                    return String(value || '').toLowerCase() === 'prd'
                        ? '<span class="badge text-bg-primary">PRD · dia todo</span>'
                        : '<span class="badge text-bg-secondary">Indisponibilidade</span>';
                }],
                ['horario_id', 'Horário', function (id, row) {
                    if (String(row.tipo || '').toLowerCase() === 'prd') return 'Dia todo';
                    if (!id) return 'Dia todo';
                    const slot = findById(KEYS.horarios, id);
                    return h(slot ? slot.hora_inicio + '–' + slot.hora_fim : 'Horário removido');
                }],
                ['disponivel', 'Situação', function (value, row) {
                    if (String(row.tipo || '').toLowerCase() === 'prd') return '<span class="text-primary fw-semibold">Sem aulas</span>';
                    return statusBadge(Number(value) === 1 ? 'Disponível' : 'Indisponível');
                }],
                ['semestre_letivo', 'Semestre']
            ]
        },
        peculiaridades: {
            title: 'Peculiaridades', icon: 'bi-shield-check', key: KEYS.peculiaridades, module: 'Peculiaridades',
            fields: [
                { name: 'nome', label: 'Nome da proteção', required: true, placeholder: 'Ex.: Momento cívico, DEPAE, PPS' },
                { name: 'descricao', label: 'Descrição', placeholder: 'Descreva o uso deste horário protegido' }
            ],
            columns: [
                ['nome', 'Proteção'],
                ['descricao', 'Descrição', function (value) { return h(value || '—'); }]
            ]
        },
        eventos: {
            title: 'Eventos', icon: 'bi-calendar-event', key: KEYS.eventos, module: 'Eventos',
            fields: [
                { name: 'nome', label: 'Nome do evento', required: true, placeholder: 'Ex.: Momento cívico' },
                { name: 'descricao', label: 'Descrição', placeholder: 'Descreva este evento recorrente da escola' }
            ],
            columns: [
                ['nome', 'Evento'],
                ['descricao', 'Descrição', function (value) { return h(value || '—'); }]
            ]
        },
        demandas: {
            title: 'Demandas das turmas', icon: 'bi-journal-plus', key: KEYS.demandas, module: 'TurmaDisciplina',
            fields: [
                { name: 'turma_id', label: 'Turma', type: 'select', optionsFrom: 'turmas', required: true },
                { name: 'disciplina_id', label: 'Disciplina', type: 'select', optionsFrom: 'disciplinas', required: true },
                { name: 'aulas_semanais', label: 'Aulas por semana', type: 'number', min: 1, required: true, defaultValue: 1 },
                { name: 'semestre_letivo', label: 'Semestre letivo', defaultValue: getSemester(), placeholder: 'AAAA/1' }
            ],
            columns: [
                ['turma_id', 'Turma', function (id) { return h(nameById(KEYS.turmas, id)); }],
                ['curso_id', 'Curso', function (id, demand) {
                    const turma = findById(KEYS.turmas, demand.turma_id);
                    return h(turma && (turma.curso_nome || nameById(KEYS.cursos, turma.curso_id || id, '—')));
                }],
                ['disciplina_id', 'Disciplina', function (id) {
                    return '<span class="demand-discipline"><i style="--demand-color:' + subjectColor(id) + '"></i>' + h(nameById(KEYS.disciplinas, id)) + '</span>';
                }],
                ['aulas_semanais', 'Aulas/semana', demandQuantityBadge],
                ['semestre_letivo', 'Semestre']
            ]
        },
        notas: {
            title: 'Bloco de notas', icon: 'bi-journal-text', key: KEYS.notas, module: 'Notas',
            fields: [
                { name: 'titulo', label: 'Título', required: true },
                { name: 'texto', label: 'Anotação', type: 'textarea', required: true, rows: 5 },
                { name: 'status', label: 'Etapa', type: 'select', defaultValue: 'standby', options: [['standby', 'A fazer'], ['andamento', 'Em andamento'], ['concluido', 'Concluído']] },
                { name: 'prioridade', label: 'Prioridade', type: 'select', defaultValue: 'media', options: [['baixa', 'Baixa'], ['media', 'Média'], ['alta', 'Alta']] },
                { name: 'prazo', label: 'Prazo', type: 'date' },
                { name: 'cor', label: 'Cor do cartão', type: 'select', defaultValue: 'azul', options: [['azul', 'Azul'], ['verde', 'Verde'], ['laranja', 'Laranja'], ['rosa', 'Rosa'], ['roxo', 'Roxo'], ['cinza', 'Cinza']] }
            ],
            columns: [
                ['titulo', 'Título'], ['texto', 'Nota', function (value) { return '<div class="notes-text">' + h(value) + '</div>'; }],
                ['status', 'Coluna', statusBadge], ['updated_at', 'Atualizado', function (value) { return h(formatDate(value)); }]
            ]
        }
    };

    const navLabels = {
        dashboard: ['Painel', 'bi-grid-1x2'],
        grade: ['Grade oficial', 'bi-calendar3'],
        relatorios: ['Relatórios', 'bi-bar-chart'],
        armazenamento: ['Armazenamento e backup', 'bi-hdd-stack'],
        ajuda: ['Ajuda', 'bi-question-circle']
    };

    function formatDate(value) {
        if (!value) return '—';
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString('pt-BR');
    }

    function pageHeader(title, icon, description, actions) {
        return '<div class="page-heading"><div><h1><i class="bi ' + h(icon) + ' page-icon"></i>' + h(title) + '</h1>' +
            (description ? '<p>' + h(description) + '</p>' : '') + '</div>' + (actions || '') + '</div>';
    }

    function renderAvailabilityDashboardCard() {
        const records = readRecords(KEYS.disponibilidade).filter(semesterMatches);
        const days = new Map();
        records.forEach(function (record) {
            const isPrd = String(record.tipo || '').toLowerCase() === 'prd';
            const isAvailable = !isPrd && (record.disponivel === true || Number(record.disponivel) === 1 ||
                String(record.disponivel).toLowerCase() === 'sim');
            if (isAvailable || !DAYS.includes(record.dia_semana)) return;
            const teacherId = String(record.professor_id || '');
            const teacher = findById(KEYS.professores, teacherId);
            const dayRecords = days.get(record.dia_semana) || new Map();
            const summary = dayRecords.get(teacherId) || {
                nome: teacher ? teacher.nome : 'Professor removido',
                prd: false,
                wholeDay: false,
                periods: new Set()
            };
            if (isPrd) {
                summary.prd = true;
                summary.wholeDay = true;
                summary.periods.clear();
            } else if (!summary.prd) {
                const slot = record.horario_id ? findById(KEYS.horarios, record.horario_id) : null;
                if (!slot) summary.wholeDay = true;
                else summary.periods.add(slot.hora_inicio + '–' + slot.hora_fim);
            }
            dayRecords.set(teacherId, summary);
            days.set(record.dia_semana, dayRecords);
        });
        const dayRows = DAYS.filter(function (day) { return days.has(day); }).map(function (day) {
            const entries = Array.from(days.get(day).values()).sort(function (a, b) {
                return a.nome.localeCompare(b.nome, 'pt-BR');
            }).map(function (summary) {
                const label = summary.prd
                    ? '<span class="availability-kind availability-kind-prd">PRD · dia todo</span>'
                    : summary.wholeDay
                        ? '<span class="availability-kind">Dia todo</span>'
                        : '<span class="availability-times">' + h(Array.from(summary.periods).join(', ')) + '</span>';
                return '<div class="dashboard-availability-person"><strong>' + h(summary.nome) + '</strong>' + label + '</div>';
            }).join('');
            return '<section class="dashboard-availability-day"><h3>' + h(day) + '</h3>' + entries + '</section>';
        }).join('');
        return '<div class="card h-100 dashboard-availability-card"><div class="card-header d-flex justify-content-between align-items-center gap-2">' +
            '<strong>Indisponibilidades e PRDs</strong><a class="btn btn-sm btn-outline-primary" href="#/disponibilidade">Gerenciar</a></div>' +
            '<div class="card-body">' + (dayRows
                ? '<div class="dashboard-availability-days">' + dayRows + '</div>'
                : '<div class="empty-state py-3"><i class="bi bi-calendar2-check"></i>Nenhuma indisponibilidade ou PRD cadastrado para ' + h(getSemester()) + '.</div>') +
            '</div></div>';
    }

    function renderDashboard() {
        const gradeState = readSimulation(getSemester());
        const lastGeneration = gradeState.lastGenerationReport;
        const counts = [
            ['Cursos', KEYS.cursos, 'bi-mortarboard', 'cursos'],
            ['Professores', KEYS.professores, 'bi-person-workspace', 'professores'],
            ['Disciplinas', KEYS.disciplinas, 'bi-book', 'disciplinas'],
            ['Turmas', KEYS.turmas, 'bi-people', 'turmas']
        ];
        const stats = counts.map(function (item) {
            return '<div class="col-6 col-xl-3"><div class="card stat-card"><div class="stat-icon"><i class="bi ' + item[2] + '"></i></div>' +
                '<div class="stat-number">' + readRecords(item[1]).length + '</div><div class="stat-label">' + item[0] + '</div></div></div>';
        }).join('');
        const links = [
            ['Grade oficial', 'bi-calendar3', 'grade'],
            ['Cadastrar professor', 'bi-person-plus', 'professores'],
            ['Configurar demandas', 'bi-journal-plus', 'demandas'],
            ['Backup e armazenamento', 'bi-hdd-stack', 'armazenamento']
        ].map(function (item) {
            return '<div class="col-sm-6 col-xl-3"><a class="quick-link" href="#/' + item[2] + '"><i class="bi ' + item[1] + '"></i><strong>' + item[0] + '</strong></a></div>';
        }).join('');
        const recentNotes = readRecords(KEYS.notas).slice().sort(function (a, b) {
            return String(b.updated_at || '').localeCompare(String(a.updated_at || ''));
        }).slice(0, 4);
        const lastGenerationCard = lastGeneration
            ? '<div class="card mb-4"><div class="card-header d-flex justify-content-between align-items-center gap-2 flex-wrap"><strong>Última grade gerada pelo QDP</strong><a class="btn btn-sm btn-outline-primary" href="#/grade">Abrir grade oficial</a></div>' +
                '<div class="card-body"><div class="row g-3"><div class="col-sm-6 col-lg-3"><span class="text-muted small">Gerada em</span><div class="fw-semibold">' + h(formatDate(lastGeneration.geradoEm)) + '</div></div>' +
                '<div class="col-sm-6 col-lg-3"><span class="text-muted small">Aulas previstas</span><div class="fw-semibold">' + h(lastGeneration.totalPrevistas || 0) + '</div></div>' +
                '<div class="col-sm-6 col-lg-3"><span class="text-muted small">Aulas alocadas</span><div class="fw-semibold">' + h(lastGeneration.totalAtendidas || 0) + '</div></div>' +
                '<div class="col-sm-6 col-lg-3"><span class="text-muted small">Pendências</span><div class="fw-semibold">' + h(lastGeneration.totalPendentes || 0) + ' · ' + h(lastGeneration.percentual || 0) + '% atendidas</div></div></div>' +
                (gradeState.assignments.length ? '<div class="small text-muted mt-3">A grade atual contém ' + gradeState.assignments.length + ' aula(s), incluindo ajustes manuais posteriores.</div><a class="btn btn-sm btn-outline-secondary mt-2" href="#/ajustes">Abrir ajustes manuais</a>' : '') + '</div></div>'
            : '<div class="alert alert-info mb-4">Ainda não há uma grade QDP gerada para este semestre. <a href="#/grade" class="alert-link">Acesse a Grade oficial</a> para gerar.</div>';
        return pageHeader('Painel', 'bi-grid-1x2', 'Organize dados escolares e monte grades com armazenamento local.', '<span class="badge text-bg-primary align-self-center">Semestre ' + h(getSemester()) + '</span>') +
            '<div class="alert local-callout"><i class="bi bi-shield-check me-2"></i>Sem conta e sem servidor: seus registros ficam no armazenamento deste navegador. Faça backups periódicos em Armazenamento e backup.</div>' +
            '<div class="row g-3 mb-4">' + stats + '</div>' +
            '<div class="row g-3 mb-4"><div class="col-12">' + renderAvailabilityDashboardCard() + '</div></div>' +
            lastGenerationCard +
            '<div class="d-flex align-items-center justify-content-between mb-2"><h2 class="h5 mb-0">Acesso rápido</h2><a href="#/ajuda" class="small">Como funciona</a></div>' +
            '<div class="row g-3 mb-4">' + links + '</div>' +
            '<div class="card"><div class="card-header d-flex justify-content-between align-items-center"><span>Notas recentes</span><a class="btn btn-sm btn-outline-primary" href="#/notas">Abrir bloco de notas</a></div>' +
            (recentNotes.length ? '<div class="list-group list-group-flush">' + recentNotes.map(function (note) {
                return '<div class="list-group-item"><div class="d-flex justify-content-between gap-3"><strong>' + h(note.titulo) + '</strong>' + statusBadge(noteStatusLabel(note.status)) + '</div><div class="small text-muted mt-1">' + h(String(note.texto || '').slice(0, 220)) + '</div></div>';
            }).join('') + '</div>' : '<div class="empty-state"><i class="bi bi-journal"></i>Nenhuma nota registrada ainda.</div>') + '</div>';
    }

    function fieldOptions(field) {
        if (field.options) return field.options;
        const key = KEYS[field.optionsFrom];
        if (!key) return [];
        return readRecords(key).filter(function (record) {
            return !(field.name === 'horario_id' && field.optionsFrom === 'horarios' &&
                String(record.tipo || 'Aula').toLowerCase() !== 'aula');
        }).map(function (record) {
            let label = record.nome || record.dia_semana || ('Registro ' + record.id);
            if (field.optionsFrom === 'horarios') label = record.dia_semana + ' · ' + record.hora_inicio + '–' + record.hora_fim + ' · ' + (record.tipo || 'Aula');
            if (field.includeIngress) {
                const ingress = teacherIngressName(record);
                if (ingress) label += ' · Ingresso: ' + ingress;
            }
            return [String(record.id), label];
        });
    }

    function renderField(field, value) {
        const id = 'field-' + field.name;
        const current = value == null ? (field.defaultValue == null ? '' : field.defaultValue) : value;
        const required = field.required ? ' required' : '';
        const min = field.min == null ? '' : ' min="' + h(field.min) + '"';
        const placeholder = field.placeholder ? ' placeholder="' + h(field.placeholder) + '"' : '';
        let control;
        if (field.type === 'select') {
            const options = fieldOptions(field);
            control = '<select class="form-select" id="' + id + '" name="' + h(field.name) + '"' + required + '>' +
                (field.optional ? '<option value="">Não informado</option>' : '') +
                options.map(function (option) {
                    const selected = String(current) === String(option[0]) ? ' selected' : '';
                    const schedule = field.name === 'horario_id' && field.optionsFrom === 'horarios'
                        ? findById(KEYS.horarios, option[0])
                        : null;
                    const dayData = schedule ? ' data-day="' + h(schedule.dia_semana) + '"' : '';
                    return '<option value="' + h(option[0]) + '"' + dayData + selected + '>' + h(option[1]) + '</option>';
                }).join('') + '</select>';
        } else if (field.type === 'textarea') {
            control = '<textarea class="form-control" id="' + id + '" name="' + h(field.name) + '" rows="' + h(field.rows || 3) + '"' + required + placeholder + '>' + h(current) + '</textarea>';
        } else {
            control = '<input class="form-control" id="' + id + '" name="' + h(field.name) + '" type="' + h(field.type || 'text') + '"' +
                (field.type === 'number' ? ' step="1"' : '') + min + placeholder + required + ' value="' + h(current) + '">';
        }
        return '<div class="col-md-6"><label class="form-label" for="' + id + '">' + h(field.label) + (field.required ? ' *' : '') + '</label>' + control + '</div>';
    }

    function ensureInputPlaceholders() {
        view.querySelectorAll('input:not([placeholder])').forEach(function (input) {
            if (!['text', 'search', 'email', 'tel', 'number', 'url'].includes(input.type)) return;
            const label = input.labels && input.labels.length
                ? input.labels[0].textContent.trim().replace(/\s*\*$/, '')
                : input.getAttribute('aria-label') || input.name || '';
            input.placeholder = input.type === 'search'
                ? 'Digite para filtrar'
                : label ? 'Informe ' + label.toLocaleLowerCase('pt-BR') : 'Digite aqui';
        });
    }

    function sortSelectOptions(root) {
        root.querySelectorAll('select').forEach(function (select) {
            const options = Array.from(select.options);
            const placeholders = options.filter(function (option) { return option.value === ''; });
            const choices = options.filter(function (option) { return option.value !== ''; }).sort(function (a, b) {
                return a.textContent.trim().localeCompare(b.textContent.trim(), 'pt-BR', { sensitivity: 'base', numeric: true });
            });
            placeholders.concat(choices).forEach(function (option) {
                select.appendChild(option);
            });
        });
    }

    function normalizeCatalogValue(value) {
        return String(value == null ? '' : value).trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');
    }

    function parseDelimitedCsv(text, delimiter) {
        const rows = [];
        let row = [];
        let field = '';
        let quoted = false;
        const source = text.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
        for (let index = 0; index < source.length; index += 1) {
            const character = source[index];
            if (quoted) {
                if (character === '"' && source[index + 1] === '"') {
                    field += '"';
                    index += 1;
                } else if (character === '"') {
                    quoted = false;
                } else {
                    field += character;
                }
            } else if (character === '"' && !field) {
                quoted = true;
            } else if (character === delimiter) {
                row.push(field);
                field = '';
            } else if (character === '\n') {
                row.push(field);
                rows.push(row);
                row = [];
                field = '';
            } else {
                field += character;
            }
        }
        if (quoted) throw new Error('O CSV tem um campo entre aspas que não foi fechado.');
        if (field || row.length) {
            row.push(field);
            rows.push(row);
        }
        return rows;
    }

    function catalogGridRows(rows, schema) {
        if (!rows.length) throw new Error('O arquivo está vazio.');

        const headerPositions = {};
        const unknownHeaders = [];
        rows[0].forEach(function (header, index) {
            const normalized = normalizeCatalogValue(header).replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
            const fieldName = Object.keys(schema.aliases).find(function (key) {
                return schema.aliases[key].some(function (alias) { return normalized === alias; });
            });
            if (!fieldName) {
                if (String(header).trim()) unknownHeaders.push(String(header).trim());
                return;
            }
            if (headerPositions[fieldName] !== undefined) throw new Error('A coluna "' + header + '" aparece mais de uma vez.');
            headerPositions[fieldName] = index;
        });
        if (headerPositions.nome === undefined) throw new Error('A planilha precisa ter uma coluna "Nome" ou "Nome da turma".');
        if (unknownHeaders.length) throw new Error('Colunas não reconhecidas: ' + unknownHeaders.join(', ') + '. Use o modelo CSV deste cadastro.');

        const dataRows = rows.slice(1).filter(function (values) {
            return values.some(function (value) { return String(value).trim(); });
        });
        if (!dataRows.length) throw new Error('Nenhum registro preenchido foi encontrado abaixo do cabeçalho.');
        if (dataRows.length > 5000) throw new Error('O arquivo excede o limite de 5.000 registros por importação.');
        return dataRows.map(function (values, index) {
            if (values.length !== rows[0].length) {
                return { line: index + 2, message: 'A quantidade de colunas não corresponde ao cabeçalho. Confira separadores e campos entre aspas.' };
            }
            const fields = {};
            Object.keys(headerPositions).forEach(function (fieldName) {
                fields[fieldName] = String(values[headerPositions[fieldName]] == null ? '' : values[headerPositions[fieldName]]).trim();
            });
            return { line: index + 2, id: fields.id || '', fields: fields };
        });
    }

    function catalogCsvRows(text, schema) {
        const delimiters = [';', ',', '\t'];
        const delimiter = delimiters.map(function (candidate) {
            return { value: candidate, columns: parseDelimitedCsv(text, candidate)[0] || [] };
        }).sort(function (a, b) { return b.columns.length - a.columns.length; })[0];
        return catalogGridRows(parseDelimitedCsv(text, delimiter.value), schema);
    }

    function excelCellText(cell) {
        const value = cell.value;
        if (value == null) return '';
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value);
        if (value instanceof Date) return value.toISOString().slice(0, 10);
        if (Array.isArray(value.richText)) {
            return value.richText.map(function (part) { return part.text || ''; }).join('');
        }
        if (Object.prototype.hasOwnProperty.call(value, 'result')) return String(value.result == null ? '' : value.result);
        return cell.text || '';
    }

    async function catalogXlsxRows(buffer, schema) {
        if (!window.ExcelJS) throw new Error('O suporte a arquivos Excel não foi carregado. Verifique a conexão e atualize a página.');
        const workbook = new window.ExcelJS.Workbook();
        await workbook.xlsx.load(buffer);
        const worksheet = workbook.worksheets.find(function (sheet) { return sheet.state === 'visible'; });
        if (!worksheet) throw new Error('O arquivo Excel não contém uma planilha visível.');
        if (worksheet.rowCount > 5001) throw new Error('O arquivo excede o limite de 5.000 registros por importação.');
        const rows = [];
        worksheet.eachRow({ includeEmpty: false }, function (row) {
            const values = [];
            for (let column = 1; column <= row.cellCount; column += 1) {
                values.push(excelCellText(row.getCell(column)));
            }
            rows.push(values);
        });
        return catalogGridRows(rows, schema);
    }

    function importStatus(value, active, inactive) {
        if (!value) return active;
        const normalized = normalizeCatalogValue(value);
        if (normalized === normalizeCatalogValue(active)) return active;
        if (normalized === normalizeCatalogValue(inactive)) return inactive;
        throw new Error('Status inválido. Use "' + active + '" ou "' + inactive + '".');
    }

    function importInteger(value, label, defaultValue, min) {
        if (!value) return defaultValue;
        const number = Number(value.replace(',', '.'));
        if (!Number.isInteger(number) || number < min) throw new Error(label + ' deve ser um número inteiro igual ou maior que ' + min + '.');
        return number;
    }

    function importListValue(value, label, options) {
        const normalized = normalizeCatalogValue(value);
        const match = options.find(function (option) { return normalizeCatalogValue(option) === normalized; });
        if (!match) throw new Error(label + ' inválido. Use uma das opções: ' + options.join(', ') + '.');
        return match;
    }

    function importCatalogRecord(route, fields) {
        const name = String(fields.nome || '').trim();
        if (!name) throw new Error('O nome é obrigatório.');
        if (route === 'cursos') {
            return { nome: name, sigla: fields.sigla || '', status: importStatus(fields.status, 'Ativo', 'Inativo') };
        }
        if (route === 'professores') {
            if (fields.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) throw new Error('E-mail inválido.');
            const weeklyHours = importInteger(fields.carga_horaria_semanal, 'Carga semanal', 40, 0);
            if (![10, 20, 30, 40].includes(weeklyHours)) throw new Error('Carga semanal deve ser 10, 20, 30 ou 40 aulas.');
            const dailyLimit = importInteger(fields.limite_aulas_dia, 'Limite de aulas por dia', 5, 1);
            if (dailyLimit > 12) throw new Error('Limite de aulas por dia deve estar entre 1 e 12.');
            return {
                nome: name, matricula: fields.matricula || '', email: fields.email || '',
                disciplina_ingresso: String(fields.disciplina_ingresso || '').trim(),
                telefone: fields.telefone || '',
                titulacao: fields.titulacao ? importListValue(fields.titulacao, 'Titulação', ['Graduado(a)', 'Especializado(a)', 'Mestre', 'Doutor(a)', 'PHD']) : '',
                carga_horaria_semanal: weeklyHours, limite_aulas_dia: dailyLimit,
                status: importStatus(fields.status, 'Ativo', 'Inativo')
            };
        }
        const courseName = String(fields.curso_nome || '').trim();
        let course = null;
        if (courseName) {
            course = readRecords(KEYS.cursos).find(function (record) {
                return normalizeCatalogValue(record.nome) === normalizeCatalogValue(courseName);
            });
            if (!course) throw new Error('O curso "' + courseName + '" não existe. Cadastre ou importe o curso antes.');
        }
        if (route === 'disciplinas') {
            return {
                nome: name, curso_id: course ? Number(course.id) : null,
                curso_nome: course ? course.nome : '',
                status: importStatus(fields.status, 'Ativa', 'Inativa')
            };
        }
        const year = importInteger(fields.ano_letivo, 'Ano letivo', new Date().getFullYear(), 2000);
        const semester = fields.semestre_letivo || getSemester();
        if (!/^\d{4}\/[12]$/.test(semester)) throw new Error('Semestre letivo inválido. Use o formato AAAA/1 ou AAAA/2.');
        return {
            nome: name, curso_id: course ? Number(course.id) : null,
            curso_nome: course ? course.nome : '', ano_letivo: year,
            periodo: fields.periodo ? importListValue(fields.periodo, 'Período/turno', PERIODOS) : '',
            semestre_letivo: semester,
            status: importStatus(fields.status, 'Ativa', 'Inativa')
        };
    }

    function catalogDuplicateReason(route, record, existing) {
        const sameName = function (item) { return normalizeCatalogValue(item.nome) === normalizeCatalogValue(record.nome); };
        if (route === 'professores') {
            return existing.some(function (item) {
                const sameRegistration = record.matricula && item.matricula &&
                    normalizeCatalogValue(item.matricula) === normalizeCatalogValue(record.matricula);
                return sameRegistration || (sameName(item) && (!record.matricula || !item.matricula));
            }) ? 'Professor com matrícula já cadastrada ou nome equivalente sem matrícula.' : '';
        }
        return existing.some(function (item) {
            if (!sameName(item)) return false;
            if (route === 'disciplinas') return String(item.curso_id || '') === String(record.curso_id || '');
            if (route === 'turmas') {
                return String(item.ano_letivo || '') === String(record.ano_letivo) &&
                    String(item.semestre_letivo || '') === String(record.semestre_letivo);
            }
            return true;
        }) ? 'Registro equivalente já cadastrado.' : '';
    }

    function prepareCatalogImport(route, filename, rows) {
        const existing = readRecords(specs[route].key);
        const accepted = [];
        const seenIds = new Set();
        const preview = rows.map(function (row) {
            if (row.message) return { line: row.line, status: 'error', message: row.message };
            try {
                let oldRecord = null;
                if (row.id) {
                    if (!/^[1-9]\d*$/.test(row.id) || !Number.isSafeInteger(Number(row.id))) {
                        throw new Error('ID inválido. Use o ID numérico exportado pelo sistema ou deixe a coluna vazia para criar um registro.');
                    }
                    if (seenIds.has(row.id)) throw new Error('ID repetido nesta planilha.');
                    seenIds.add(row.id);
                    oldRecord = existing.find(function (record) { return String(record.id) === row.id; }) || null;
                    if (!oldRecord) throw new Error('O ID ' + row.id + ' não existe neste cadastro. Baixe uma nova cópia preenchida pelo sistema.');
                }
                const record = importCatalogRecord(route, row.fields);
                const comparable = existing.filter(function (item) {
                    return !oldRecord || String(item.id) !== String(oldRecord.id);
                }).concat(accepted);
                const duplicate = catalogDuplicateReason(route, record, comparable);
                if (duplicate) return { line: row.line, record: record, status: 'duplicate', message: duplicate };
                if (oldRecord) record.id = oldRecord.id;
                accepted.push(record);
                return {
                    line: row.line, record: record, status: 'valid',
                    update: Boolean(oldRecord),
                    message: oldRecord ? 'Pronto para atualizar o registro existente.' : 'Pronto para importar.'
                };
            } catch (error) {
                return { line: row.line, status: 'error', message: error.message || 'Registro inválido.' };
            }
        });
        catalogImport = { route: route, filename: filename, rows: preview, accepted: accepted };
        render();
    }

    function renderCatalogImport(route) {
        if (!catalogImport || catalogImport.route !== route) return '';
        const rows = catalogImport.rows;
        const validCount = catalogImport.accepted.length;
        const errors = rows.filter(function (row) { return row.status === 'error'; }).length;
        const duplicates = rows.filter(function (row) { return row.status === 'duplicate'; }).length;
        const detailLabels = {
            id: 'ID',
            sigla: 'Sigla', matricula: 'Matrícula', email: 'E-mail', telefone: 'Telefone',
            titulacao: 'Titulação', carga_horaria_semanal: 'Carga semanal',
            limite_aulas_dia: 'Limite diário', disciplina_ingresso: 'Disciplina de ingresso',
            curso_nome: 'Curso', ano_letivo: 'Ano letivo',
            periodo: 'Período', semestre_letivo: 'Semestre', status: 'Status'
        };
        const previewRows = errors || duplicates
            ? rows.filter(function (row) { return row.status === 'error' || row.status === 'duplicate'; })
            : rows.slice(0, 100);
        const visibleRows = previewRows.map(function (row) {
            const name = row.record ? row.record.nome : '—';
            const details = row.record ? Object.keys(row.record).filter(function (key) {
                return key !== 'nome';
            }).map(function (key) {
                const rawValue = row.record[key];
                const value = rawValue == null || rawValue === '' ? '—' : rawValue;
                return '<span><strong>' + h(detailLabels[key] || key) + ':</strong> ' + h(value) + '</span>';
            }).join(' · ') : '—';
            const label = row.status === 'valid' ? row.update ? 'Atualizar' : 'Importável' : row.status === 'duplicate' ? 'Ignorado · duplicado' : 'Erro';
            const badge = row.status === 'valid' ? 'success' : row.status === 'duplicate' ? 'secondary' : 'danger';
            return '<tr><td>' + row.line + '</td><td>' + h(name) + '</td><td><div class="small">' + details + '</div></td><td><span class="badge text-bg-' + badge + '">' + label + '</span></td><td>' + h(row.message) + '</td></tr>';
        }).join('');
        const importStatus = errors || duplicates
            ? '<div class="alert alert-warning">Exibindo todas as linhas com erro e todos os ' + duplicates + ' registro(s) duplicado(s), inclusive após as primeiras 100 linhas; a coluna Detalhe informa o motivo da rejeição. Os ' + validCount + ' registro(s) válidos podem ser importados sem incluir essas linhas.</div>'
            : '<div class="alert alert-success">Tudo certo: ' + validCount + ' registro(s) estão prontos para importar.</div>';
        return '<div class="card border-primary mb-4"><div class="card-header d-flex justify-content-between align-items-center gap-2 flex-wrap"><strong>Revisar importação · ' + h(catalogImport.filename) + '</strong>' +
            '<button class="btn btn-sm btn-outline-secondary" type="button" data-action="cancel-catalog-import">Cancelar</button></div><div class="card-body">' +
            '<p class="mb-2"><strong>' + validCount + '</strong> para importar · <strong>' + duplicates + '</strong> duplicado(s) ignorado(s) · <strong>' + errors + '</strong> erro(s).</p>' +
            importStatus +
            (previewRows.length ? '<div class="table-responsive mb-3"><table class="table table-sm table-striped align-middle"><thead><tr><th>Linha</th><th>Nome</th><th>Dados</th><th>Resultado</th><th>Detalhe</th></tr></thead><tbody>' + visibleRows + '</tbody></table></div>' : '') +
            (!errors && rows.length > 100 ? '<p class="small text-muted">Prévia das primeiras 100 de ' + rows.length + ' linhas; todas as linhas foram verificadas.</p>' : '') +
            '<button class="btn btn-primary" type="button" data-action="confirm-catalog-import"' + (validCount ? '' : ' disabled') + '><i class="bi bi-upload me-1"></i>Importar ' + validCount + ' registro(s) válidos</button>' +
            '<span class="small text-muted ms-2">IDs preenchidos atualizam registros existentes; sem ID, um novo registro é criado.</span></div></div>';
    }

    function downloadCatalogBlob(filename, blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    }

    function getSemesterOptions(semester, radius) {
        const parts = /^(\d{4})\/([12])$/.exec(semester);
        if (!parts) throw new Error('O semestre atual não está em um formato válido.');
        const currentIndex = Number(parts[1]) * 2 + Number(parts[2]) - 1;
        return Array.from({ length: radius * 2 + 1 }, function (_, index) {
            const semesterIndex = currentIndex + index - radius;
            return Math.floor(semesterIndex / 2) + '/' + (semesterIndex % 2 + 1);
        });
    }

    async function downloadCatalogTemplate(route, format) {
        const schema = catalogImportSchemas[route];
        if (format !== 'xlsx') {
            const csv = '\uFEFF' + schema.headers.map(function (header) {
                return '"' + header.replace(/"/g, '""') + '"';
            }).join(';') + '\r\n';
            downloadCatalogBlob(schema.filename, new Blob([csv], { type: 'text/csv;charset=utf-8' }));
            return;
        }
        if (!window.ExcelJS) throw new Error('O suporte a arquivos Excel não foi carregado. Verifique a conexão e atualize a página.');

        const workbook = new window.ExcelJS.Workbook();
        workbook.creator = 'Owltime';
        workbook.subject = 'Modelo de importação de cadastro';
        const worksheet = workbook.addWorksheet(specs[route].title);
        const headerRow = worksheet.addRow(schema.headers);
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1D4E89' } };
        worksheet.views = [{ state: 'frozen', ySplit: 1 }];
        worksheet.autoFilter = { from: 'A1', to: worksheet.getRow(1).getCell(schema.headers.length).address };
        worksheet.columns = schema.headers.map(function (header) {
            return { width: Math.max(18, Math.min(34, header.length + 4)) };
        });

        const listSheet = workbook.addWorksheet('Listas');
        listSheet.state = 'veryHidden';
        const validations = [];
        if (route === 'cursos') validations.push({ column: 4, name: 'Status', values: ['Ativo', 'Inativo'] });
        if (route === 'professores') {
            validations.push(
                { column: 7, name: 'Titulos', values: ['Graduado(a)', 'Especializado(a)', 'Mestre', 'Doutor(a)', 'PHD'] },
                { column: 8, name: 'CargasSemanais', values: ['10', '20', '30', '40'] },
                { column: 9, name: 'LimitesDiarios', values: Array.from({ length: 12 }, function (_, index) { return String(index + 1); }) },
                { column: 10, name: 'Status', values: ['Ativo', 'Inativo'] }
            );
        }
        if (route === 'disciplinas' || route === 'turmas') {
            const courses = readRecords(KEYS.cursos).map(function (course) { return String(course.nome || '').trim(); }).filter(Boolean);
            if (courses.length) validations.push({ column: 3, name: 'Cursos', values: courses });
            if (route === 'turmas') {
                const currentYear = new Date().getFullYear();
                validations.push(
                    { column: 4, name: 'AnosLetivos', values: [currentYear - 1, currentYear, currentYear + 1] },
                    { column: 5, name: 'Periodos', values: PERIODOS },
                    { column: 6, name: 'SemestresLetivos', values: getSemesterOptions(getSemester(), 2) }
                );
            }
            validations.push({ column: route === 'disciplinas' ? 4 : 7, name: 'Status', values: ['Ativa', 'Inativa'] });
        }

        validations.forEach(function (validation, index) {
            const listColumn = index + 1;
            listSheet.getCell(1, listColumn).value = validation.name;
            validation.values.forEach(function (value, valueIndex) {
                listSheet.getCell(valueIndex + 2, listColumn).value = value;
            });
            const lastRow = Math.max(2, validation.values.length + 1);
            const range = 'Listas!$' + listSheet.getColumn(listColumn).letter + '$2:$' +
                listSheet.getColumn(listColumn).letter + '$' + lastRow;
            const rangeName = validation.name;
            workbook.definedNames.add(range, rangeName);
            worksheet.dataValidations.add(
                worksheet.getColumn(validation.column).letter + '2:' + worksheet.getColumn(validation.column).letter + '5001',
                { type: 'list', allowBlank: true, formulae: ['=' + rangeName], showErrorMessage: true, errorTitle: 'Valor inválido', error: 'Selecione uma opção da lista.' }
            );
        });

        const buffer = await workbook.xlsx.writeBuffer();
        downloadCatalogBlob('modelo_' + route + '.xlsx', new Blob([buffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }));
    }

    function spreadsheetDisplayValue(field, record) {
        const value = record[field.name];
        if (field.type === 'select' && field.optionsFrom && value != null && value !== '') {
            const option = fieldOptions(field).find(function (item) { return String(item[0]) === String(value); });
            return option ? option[1] : '';
        }
        if (field.type === 'select' && field.optionsFrom === 'cursos' && record.curso_nome) return record.curso_nome;
        return value == null ? '' : value;
    }

    function currentSpreadsheetOption(field, input) {
        const normalizedInput = normalizeCatalogValue(input);
        const options = fieldOptions(field);
        const exactOption = options.find(function (option) {
            return normalizeCatalogValue(option[0]) === normalizedInput ||
                normalizeCatalogValue(option[1]) === normalizedInput;
        });
        if (exactOption || field.optionsFrom !== 'professores') return exactOption;

        const professorName = String(input).replace(/\s*(?:·|—|-|\|)\s*ingresso\s*:.+$/i, '').trim();
        const matches = readRecords(KEYS.professores).filter(function (professor) {
            return normalizeCatalogValue(professor.nome) === normalizeCatalogValue(professorName);
        });
        if (matches.length > 1) {
            throw new Error('O professor "' + professorName + '" aparece mais de uma vez. Use um nome exclusivo na coluna Professor.');
        }
        if (!matches.length) return null;
        const professorId = String(matches[0].id);
        return options.find(function (option) { return String(option[0]) === professorId; }) || null;
    }

    function resolveVinculoProfessors(input) {
        const professorName = String(input).replace(/\s*(?:·|—|-|\|)\s*ingresso\s*:.+$/i, '').trim();
        const exactOption = currentSpreadsheetOption(specs.vinculos.fields[0], input);
        if (exactOption) return [{ id: Number(exactOption[0]) }];
        const names = professorName.split('/').map(function (name) { return name.trim(); }).filter(Boolean);
        if (!names.length) throw new Error('Informe um professor válido.');
        const professors = readRecords(KEYS.professores);
        const resolved = [];
        names.forEach(function (name) {
            const normalizedName = normalizeCatalogValue(name);
            const matches = professors.filter(function (professor) {
                const normalizedFullName = normalizeCatalogValue(professor.nome);
                return normalizedFullName === normalizedName ||
                    (professorName.includes('/') && normalizedFullName.startsWith(normalizedName + ' '));
            });
            if (matches.length > 1) {
                throw new Error('O nome "' + name + '" corresponde a mais de um professor. Use o nome completo na planilha.');
            }
            if (!matches.length) {
                throw new Error('Não foi possível localizar o professor "' + name + '" no cadastro.');
            }
            if (!resolved.some(function (item) { return String(item.id) === String(matches[0].id); })) {
                resolved.push(matches[0]);
            }
        });
        return resolved;
    }

    function readVinculoSpreadsheetRows(worksheet, idPosition, fieldPositions) {
        const currentLinks = readRecords(KEYS.vinculos);
        const currentDisciplines = readRecords(KEYS.disciplinas);
        const pendingDisciplines = [];
        const seenIds = new Set();
        const seenPairs = new Set();
        const rows = [];
        let nextLinkIdValue = nextId(currentLinks);
        let nextDisciplineIdValue = nextId(currentDisciplines);
        worksheet.eachRow({ includeEmpty: false }, function (row, rowNumber) {
            if (rowNumber === 1) return;
            const values = [];
            for (let column = 1; column <= row.cellCount; column += 1) {
                values.push(excelCellText(row.getCell(column)).trim());
            }
            if (!values.some(Boolean)) return;
            try {
                const sourceId = values[idPosition];
                if (sourceId && seenIds.has(sourceId)) throw new Error('ID repetido nesta planilha.');
                if (sourceId) seenIds.add(sourceId);
                const oldRecord = sourceId
                    ? currentLinks.find(function (record) { return String(record.id) === sourceId; })
                    : null;
                if (sourceId && !oldRecord) {
                    throw new Error('O ID ' + sourceId + ' não existe neste cadastro. Baixe uma nova cópia preenchida pelo sistema.');
                }
                const professorInput = values[fieldPositions[0]] || '';
                const disciplineInput = values[fieldPositions[1]] || '';
                const semester = values[fieldPositions[2]] || getSemester();
                if (!professorInput) throw new Error('"Professor" é obrigatório.');
                if (!disciplineInput) throw new Error('"Disciplina" é obrigatório.');
                if (!/^\d{4}\/[12]$/.test(semester)) throw new Error('Semestre letivo inválido. Use o formato AAAA/1 ou AAAA/2.');

                const professors = resolveVinculoProfessors(professorInput);
                if (sourceId && professors.length > 1) {
                    throw new Error('Uma linha com ID só pode indicar um professor. Deixe o ID vazio para importar uma atribuição compartilhada.');
                }
                let discipline = currentDisciplines.find(function (item) {
                    return normalizeCatalogValue(item.nome) === normalizeCatalogValue(disciplineInput);
                }) || pendingDisciplines.find(function (item) {
                    return normalizeCatalogValue(item.nome) === normalizeCatalogValue(disciplineInput);
                });
                let newDiscipline = false;
                let createdDiscipline = null;
                if (!discipline) {
                    createdDiscipline = {
                        id: nextDisciplineIdValue,
                        nome: disciplineInput,
                        curso_id: null,
                        curso_nome: '',
                        status: 'Ativa'
                    };
                    discipline = createdDiscipline;
                    newDiscipline = true;
                } else {
                    newDiscipline = pendingDisciplines.includes(discipline);
                }

                const rowRecords = [];
                professors.forEach(function (professor, index) {
                    const identity = [
                        String(professor.id),
                        String(discipline.id),
                        semester
                    ].join('|');
                    if (seenPairs.has(identity)) {
                        throw new Error('Este professor e disciplina aparecem mais de uma vez neste semestre na planilha.');
                    }
                    const existingLinks = currentLinks.filter(function (item) {
                        return String(item.professor_id) === String(professor.id) &&
                            String(item.disciplina_id) === String(discipline.id) &&
                            String(item.semestre_letivo || getSemester()) === semester &&
                            (!oldRecord || String(item.id) !== String(oldRecord.id));
                    });
                    if (existingLinks.length > 1) {
                        throw new Error('Este vínculo já aparece mais de uma vez no cadastro; corrija os registros existentes antes de importar.');
                    }
                    const matchedLink = oldRecord || existingLinks[0] || null;
                    rowRecords.push({
                        record: {
                            id: matchedLink ? matchedLink.id : nextLinkIdValue + index,
                            professor_id: Number(professor.id),
                            disciplina_id: Number(discipline.id),
                            semestre_letivo: semester
                        },
                        update: Boolean(matchedLink),
                        newDiscipline: newDiscipline,
                        disciplineName: discipline.nome,
                        professorName: nameById(KEYS.professores, professor.id, 'Professor')
                    });
                });
                rowRecords.forEach(function (item) {
                    const identity = [
                        String(item.record.professor_id),
                        String(item.record.disciplina_id),
                        item.record.semestre_letivo
                    ].join('|');
                    seenPairs.add(identity);
                    if (!item.update) nextLinkIdValue = Math.max(nextLinkIdValue, Number(item.record.id) + 1);
                    rows.push({
                        line: rowNumber,
                        record: item.record,
                        update: item.update,
                        newDiscipline: item.newDiscipline,
                        disciplineName: item.disciplineName,
                        professorName: item.professorName,
                        error: ''
                    });
                });
                if (createdDiscipline) {
                    pendingDisciplines.push(createdDiscipline);
                    nextDisciplineIdValue += 1;
                }
            } catch (error) {
                rows.push({ line: rowNumber, record: null, update: false, error: error.message || 'Registro inválido.' });
            }
        });
        if (!rows.length) throw new Error('Nenhuma linha preenchida foi encontrada abaixo do cabeçalho.');
        return { rows: rows, newDisciplines: pendingDisciplines };
    }

    async function downloadCurrentSpreadsheet(route) {
        if (!window.ExcelJS) throw new Error('O suporte a arquivos Excel não foi carregado. Verifique a conexão e atualize a página.');
        const spec = specs[route];
        if (!spec) throw new Error('Esta tela não possui registros para exportar.');
        const workbook = new window.ExcelJS.Workbook();
        workbook.creator = 'Owltime';
        workbook.subject = 'Planilha editável de ' + spec.title;
        const worksheet = workbook.addWorksheet(spec.title.slice(0, 31));
        const headers = ['ID'].concat(spec.fields.map(function (field) { return field.label; }));
        const header = worksheet.addRow(headers);
        header.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1D4E89' } };
        const records = readRecords(spec.key);
        records.forEach(function (record) {
            worksheet.addRow([record.id].concat(spec.fields.map(function (field) {
                return spreadsheetDisplayValue(field, record);
            })));
        });
        const validationEndRow = Math.max(101, records.length + 100);
        worksheet.views = [{ state: 'frozen', ySplit: 1 }];
        worksheet.autoFilter = { from: 'A1', to: worksheet.getRow(1).getCell(headers.length).address };
        worksheet.columns = headers.map(function (value, index) {
            return { width: Math.max(14, Math.min(34, index ? value.length + 5 : 10)) };
        });
        const listSheet = workbook.addWorksheet('Listas');
        listSheet.state = 'veryHidden';
        spec.fields.forEach(function (field, index) {
            if (field.type !== 'select') return;
            const options = fieldOptions(field).map(function (option) { return option[1]; }).filter(Boolean);
            if (!options.length) return;
            const listColumn = index + 1;
            const column = listSheet.getColumn(listColumn).letter;
            listSheet.getCell(1, listColumn).value = field.name;
            options.forEach(function (value, optionIndex) {
                listSheet.getCell(optionIndex + 2, listColumn).value = value;
            });
            const name = 'Opcao' + (index + 1);
            workbook.definedNames.add('Listas!$' + column + '$2:$' + column + '$' + (options.length + 1), name);
            const worksheetColumn = worksheet.getColumn(index + 2).letter;
            worksheet.dataValidations.add(worksheetColumn + '2:' + worksheetColumn + validationEndRow, {
                type: 'list', allowBlank: !field.required, formulae: ['=' + name],
                showErrorMessage: true, errorTitle: 'Valor inválido', error: 'Selecione uma opção da lista.'
            });
        });
        const buffer = await workbook.xlsx.writeBuffer();
        downloadCatalogBlob('dados_' + route + '.xlsx', new Blob([buffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }));
    }

    async function readCurrentSpreadsheet(buffer, route) {
        if (!window.ExcelJS) throw new Error('O suporte a arquivos Excel não foi carregado. Verifique a conexão e atualize a página.');
        const spec = specs[route];
        const workbook = new window.ExcelJS.Workbook();
        await workbook.xlsx.load(buffer);
        const worksheet = workbook.worksheets.find(function (sheet) { return sheet.state === 'visible'; });
        if (!worksheet) throw new Error('O arquivo Excel não contém uma planilha visível.');
        if (worksheet.rowCount > 5001) throw new Error('O arquivo excede o limite de 5.000 registros por importação.');
        const header = [];
        for (let column = 1; column <= worksheet.getRow(1).cellCount; column += 1) {
            header.push(normalizeCatalogValue(excelCellText(worksheet.getRow(1).getCell(column))));
        }
        const positions = new Map(header.map(function (name, index) { return [name, index]; }));
        const idPosition = positions.get('id');
        if (idPosition === undefined) throw new Error('A planilha não contém a coluna ID. Baixe uma nova cópia preenchida pelo sistema.');
        const fieldPositions = spec.fields.map(function (field) {
            const position = positions.get(normalizeCatalogValue(field.label));
            if (position === undefined) throw new Error('A planilha está sem a coluna "' + field.label + '". Baixe uma nova cópia preenchida pelo sistema.');
            return position;
        });
        if (route === 'vinculos') {
            const imported = readVinculoSpreadsheetRows(worksheet, idPosition, fieldPositions);
            spreadsheetImport = {
                route: route,
                filename: 'planilha XLSX',
                rows: imported.rows,
                newDisciplines: imported.newDisciplines
            };
            render();
            return;
        }
        const currentRecords = readRecords(spec.key);
        const seenIds = new Set();
        const seenVinculoPairs = new Set();
        const rows = [];
        worksheet.eachRow({ includeEmpty: false }, function (row, rowNumber) {
            if (rowNumber === 1) return;
            const values = header.map(function (_, index) { return excelCellText(row.getCell(index + 1)).trim(); });
            if (!values.some(Boolean)) return;
            try {
                const id = values[idPosition];
                if (id && seenIds.has(id)) throw new Error('ID repetido nesta planilha.');
                if (id) seenIds.add(id);
                let oldRecord = id ? currentRecords.find(function (record) { return String(record.id) === id; }) : null;
                if (id && !oldRecord) throw new Error('O ID ' + id + ' não existe neste cadastro. Baixe uma nova planilha antes de editar.');
                const record = Object.assign({}, oldRecord || {});
                spec.fields.forEach(function (field, index) {
                    const input = values[fieldPositions[index]] || '';
                    if (field.required && !input) throw new Error('"' + field.label + '" é obrigatório.');
                    let value = input;
                    if (field.type === 'number') {
                        value = input === '' ? 0 : Number(input.replace(',', '.'));
                        if (!Number.isFinite(value) || !Number.isInteger(value) || (field.min != null && value < field.min)) {
                            throw new Error('"' + field.label + '" deve ser um número inteiro igual ou maior que ' + (field.min || 0) + '.');
                        }
                    } else if (field.type === 'select') {
                        if (!input) value = field.name.endsWith('_id') ? null : '';
                        else {
                            const option = currentSpreadsheetOption(field, input);
                            if (!option) throw new Error('"' + field.label + '" contém uma opção inválida: ' + input + '.');
                            value = field.name.endsWith('_id') ? Number(option[0]) : option[0];
                            if (field.name === 'disponivel') value = Number(value);
                        }
                        if (field.optionsFrom === 'cursos') {
                            const course = value ? findById(KEYS.cursos, value) : null;
                            record.curso_nome = course ? course.nome : '';
                        }
                    }
                    record[field.name] = value;
                });
                if (route === 'vinculos') {
                    if (record.semestre_letivo && !/^\d{4}\/[12]$/.test(String(record.semestre_letivo))) {
                        throw new Error('Semestre letivo inválido. Use o formato AAAA/1 ou AAAA/2.');
                    }
                    record.semestre_letivo = String(record.semestre_letivo || getSemester());
                    const identity = [
                        String(record.professor_id || ''),
                        String(record.disciplina_id || ''),
                        record.semestre_letivo
                    ].join('|');
                    if (seenVinculoPairs.has(identity)) {
                        throw new Error('Este professor e disciplina aparecem mais de uma vez neste semestre na planilha.');
                    }
                    seenVinculoPairs.add(identity);
                    if (!oldRecord) {
                        const matches = currentRecords.filter(function (item) {
                            return String(item.professor_id) === String(record.professor_id) &&
                                String(item.disciplina_id) === String(record.disciplina_id) &&
                                String(item.semestre_letivo || getSemester()) === record.semestre_letivo;
                        });
                        if (matches.length > 1) {
                            throw new Error('Este vínculo já aparece mais de uma vez no cadastro; corrija os registros existentes antes de importar.');
                        }
                        if (matches.length === 1) oldRecord = matches[0];
                    }
                }
                if (route === 'disponibilidade') {
                    record.tipo = record.tipo || 'indisponibilidade';
                    if (!/^\d{4}\/[12]$/.test(String(record.semestre_letivo || getSemester()))) {
                        throw new Error('O semestre deve usar o formato AAAA/1 ou AAAA/2.');
                    }
                    if (record.tipo === 'prd') {
                        record.horario_id = null;
                        record.disponivel = 0;
                        const grade = readSimulation(record.semestre_letivo || getSemester());
                        const dayLessons = grade.assignments.filter(function (assignment) {
                            return String(assignment.professor_id) === String(record.professor_id) &&
                                String(assignment.dia_semana) === String(record.dia_semana);
                        });
                        if (dayLessons.length) throw new Error('O professor já tem aulas na grade de ' + record.dia_semana + '; remova ou realoque antes de registrar PRD.');
                    }
                }
                if (route === 'horarios' && record.hora_fim <= record.hora_inicio) {
                    throw new Error('O horário final precisa ser posterior ao horário inicial.');
                }
                if (oldRecord) record.id = oldRecord.id;
                else {
                    record.id = nextId(currentRecords.concat(rows.filter(function (item) { return item.record; }).map(function (item) { return item.record; })));
                    if (route === 'notas') record.created_at = record.created_at || new Date().toISOString();
                }
                const comparableRecords = currentRecords.concat(rows.filter(function (item) { return item.record; }).map(function (item) { return item.record; }));
                const semesterOf = function (item) { return String(item.semestre_letivo || getSemester()); };
                const duplicate = comparableRecords.some(function (item) {
                    if (String(item.id) === String(record.id)) return false;
                    if (route === 'vinculos') {
                        return String(item.professor_id) === String(record.professor_id) &&
                            String(item.disciplina_id) === String(record.disciplina_id) &&
                            semesterOf(item) === semesterOf(record);
                    }
                    if (route === 'demandas') {
                        return String(item.turma_id) === String(record.turma_id) &&
                            String(item.disciplina_id) === String(record.disciplina_id) &&
                            semesterOf(item) === semesterOf(record);
                    }
                    if (route === 'disponibilidade') {
                        return String(item.professor_id) === String(record.professor_id) &&
                            String(item.dia_semana) === String(record.dia_semana) &&
                            String(item.tipo || 'indisponibilidade') === String(record.tipo) &&
                            String(item.horario_id || '') === String(record.horario_id || '') &&
                            semesterOf(item) === semesterOf(record);
                    }
                    return false;
                });
                if (duplicate) throw new Error('Este vínculo, demanda ou registro de disponibilidade já existe neste semestre.');
                if (route === 'notas') record.updated_at = new Date().toISOString();
                rows.push({ line: rowNumber, record: record, update: Boolean(oldRecord), error: '' });
            } catch (error) {
                rows.push({ line: rowNumber, record: null, update: false, error: error.message || 'Registro inválido.' });
            }
        });
        if (!rows.length) throw new Error('Nenhuma linha preenchida foi encontrada abaixo do cabeçalho.');
        spreadsheetImport = { route: route, filename: 'planilha XLSX', rows: rows };
        render();
    }

    function renderSpreadsheetImport(route) {
        if (!spreadsheetImport || spreadsheetImport.route !== route) return '';
        const valid = spreadsheetImport.rows.filter(function (row) { return row.record; });
        const errors = spreadsheetImport.rows.filter(function (row) { return row.error; });
        const newDisciplineCount = (spreadsheetImport.newDisciplines || []).length;
        const previewRows = errors.length
            ? spreadsheetImport.rows.filter(function (row) { return row.error; })
            : spreadsheetImport.rows.slice(0, 100);
        const preview = previewRows.map(function (row) {
            const label = row.record
                ? route === 'vinculos'
                    ? (row.professorName || nameById(KEYS.professores, row.record.professor_id, 'Professor')) + ' · ' +
                        (row.disciplineName || nameById(KEYS.disciplinas, row.record.disciplina_id, 'Disciplina'))
                    : row.record.nome || row.record.titulo || row.record.dia_semana || ('ID ' + row.record.id)
                : '—';
            const actionLabel = row.error ? 'Erro' : row.update ? 'Atualizar' : 'Novo';
            const details = row.error
                ? row.error
                : row.newDiscipline
                    ? 'A disciplina será criada sem curso; associe-a ao curso no cadastro de Disciplinas.'
                    : 'Pronto para aplicar.';
            return '<tr><td>' + row.line + '</td><td>' + h(label) +
                (row.newDiscipline ? '<small class="d-block text-warning-emphasis">Nova disciplina</small>' : '') +
                '</td><td><span class="badge text-bg-' + (row.error ? 'danger' : row.update ? 'primary' : 'success') + '">' +
                actionLabel + '</span></td><td>' + h(details) + '</td></tr>';
        }).join('');
        const importInstruction = route === 'vinculos'
            ? 'Linhas sem ID atualizam vínculos iguais de professor, disciplina e semestre; nomes compostos como Dany/Aldo geram um vínculo para cada professor reconhecido.'
            : 'Linhas sem ID serão adicionadas; as demais atualizarão o registro correspondente.';
        const importStatus = errors.length
            ? '<div class="alert alert-warning">Exibindo todos os ' + errors.length + ' erro(s), inclusive os que estão após as primeiras 100 linhas. Os ' + valid.length + ' registro(s) válidos podem ser aplicados agora; linhas com erro serão ignoradas.</div>'
            : '<div class="alert alert-success">Tudo certo: ' + valid.length + ' registro(s) estão prontos para aplicar.</div>';
        return '<div class="card border-primary mb-4"><div class="card-header d-flex justify-content-between align-items-center gap-2 flex-wrap"><strong>Revisar planilha preenchida</strong>' +
            '<button class="btn btn-sm btn-outline-secondary" type="button" data-action="cancel-current-spreadsheet">Cancelar</button></div><div class="card-body">' +
            '<p><strong>' + valid.length + '</strong> registro(s) válidos · <strong>' + errors.length + '</strong> erro(s). ' + h(importInstruction) +
            (newDisciplineCount ? ' <strong>' + newDisciplineCount + '</strong> disciplina(s) ausente(s) serão criadas sem curso e precisarão ser associadas depois.' : '') + '</p>' +
            importStatus +
            (previewRows.length ? '<div class="table-responsive mb-3"><table class="table table-sm table-striped align-middle"><thead><tr><th>Linha</th><th>Registro</th><th>Ação</th><th>Detalhe</th></tr></thead><tbody>' + preview + '</tbody></table></div>' : '') +
            '<button class="btn btn-primary" type="button" data-action="confirm-current-spreadsheet"' + (valid.length ? '' : ' disabled') + '>Importar ' + valid.length + ' registro(s) válido(s)</button>' +
            (!errors.length && spreadsheetImport.rows.length > 100 ? '<p class="small text-muted mt-2">Prévia das primeiras 100 de ' + spreadsheetImport.rows.length + ' linhas; todas foram verificadas.</p>' : '') + '</div></div>';
    }

    function confirmCurrentSpreadsheet() {
        if (!spreadsheetImport) return;
        const spec = specs[spreadsheetImport.route];
        if (spreadsheetImport.route === 'vinculos' && spreadsheetImport.newDisciplines && spreadsheetImport.newDisciplines.length) {
            const disciplines = readRecords(KEYS.disciplinas);
            let nextDisciplineIdValue = nextId(disciplines);
            spreadsheetImport.newDisciplines.forEach(function (discipline) {
                const existing = disciplines.find(function (item) {
                    return normalizeCatalogValue(item.nome) === normalizeCatalogValue(discipline.nome);
                });
                if (existing) {
                    discipline.id = existing.id;
                } else {
                    if (disciplines.some(function (item) { return String(item.id) === String(discipline.id); })) {
                        discipline.id = nextDisciplineIdValue++;
                    } else {
                        nextDisciplineIdValue = Math.max(nextDisciplineIdValue, Number(discipline.id) + 1);
                    }
                    disciplines.push(discipline);
                }
                spreadsheetImport.rows.forEach(function (row) {
                    if (row.record && normalizeCatalogValue(row.disciplineName) === normalizeCatalogValue(discipline.nome)) {
                        row.record.disciplina_id = Number(discipline.id);
                    }
                });
            });
            saveRecords(KEYS.disciplinas, disciplines, specs.disciplinas.module);
        }
        const records = readRecords(spec.key);
        spreadsheetImport.rows.forEach(function (row) {
            if (!row.record) return;
            const index = records.findIndex(function (record) { return String(record.id) === String(row.record.id); });
            if (index >= 0) records[index] = row.record;
            else records.push(row.record);
        });
        saveRecords(spec.key, records, spec.module);
        const count = spreadsheetImport.rows.filter(function (row) { return row.record; }).length;
        spreadsheetImport = null;
        editing = null;
        render();
        notify(count + ' registro(s) atualizado(s) pela planilha.', 'success');
    }

    function confirmCatalogImport() {
        if (!catalogImport || !catalogImport.accepted.length) throw new Error('Não há registros válidos para importar.');
        const spec = specs[catalogImport.route];
        const records = readRecords(spec.key);
        let nextRecordId = nextId(records);
        catalogImport.accepted.forEach(function (record) {
            const index = record.id
                ? records.findIndex(function (item) { return String(item.id) === String(record.id); })
                : -1;
            if (index >= 0) {
                records[index] = Object.assign({}, records[index], record);
            } else {
                records.push(Object.assign({}, record, { id: nextRecordId++ }));
            }
        });
        saveRecords(spec.key, records, spec.module);
        const count = catalogImport.accepted.length;
        catalogImport = null;
        render();
        notify(count + ' registro(s) aplicado(s) com sucesso.', 'success');
    }

    function getAvailabilityCourseScope(courseId, semester) {
        const course = findById(KEYS.cursos, courseId);
        if (!course) return { course: null, classes: [], demands: [], teachers: [], unlinkedDisciplines: [] };
        const classes = activeRecords(KEYS.turmas, ['ativa', 'ativo']).filter(function (turma) {
            return String(turma.curso_id || '') === String(courseId) ||
                (!turma.curso_id && normalizeCatalogValue(turma.curso_nome) === normalizeCatalogValue(course.nome));
        });
        const demandsById = new Map();
        classes.forEach(function (turma) {
            getDemandsForClass(turma.id, semester).forEach(function (demand) {
                if (!demandsById.has(String(demand.disciplina_id))) demandsById.set(String(demand.disciplina_id), demand);
            });
        });
        const demandedIds = new Set(demandsById.keys());
        const links = readRecords(KEYS.vinculos).filter(function (row) {
            return semesterMatches(row, semester) && demandedIds.has(String(row.disciplina_id));
        });
        const teacherMap = new Map();
        const linkedDisciplineIds = new Set();
        links.forEach(function (link) {
            const teacher = findById(KEYS.professores, link.professor_id);
            if (!teacher || (teacher.status && !['ativo', 'ativa'].includes(String(teacher.status).toLowerCase()))) return;
            const id = String(teacher.id);
            const record = teacherMap.get(id) || { professor: teacher, disciplines: new Map() };
            const disciplineId = String(link.disciplina_id);
            const demand = demandsById.get(disciplineId);
            record.disciplines.set(disciplineId, demand ? demand.disciplina_nome : nameById(KEYS.disciplinas, disciplineId, 'Disciplina'));
            teacherMap.set(id, record);
            linkedDisciplineIds.add(disciplineId);
        });
        const unlinkedDisciplines = Array.from(demandsById.entries()).filter(function (entry) {
            return !linkedDisciplineIds.has(entry[0]);
        }).map(function (entry) { return entry[1]; });
        const prdRecords = readRecords(KEYS.disponibilidade).filter(function (record) {
            return String(record.tipo || '').toLowerCase() === 'prd' && semesterMatches(record, semester);
        });
        const teachers = Array.from(teacherMap.values()).map(function (entry) {
            const id = String(entry.professor.id);
            const days = Array.from(new Set(prdRecords.filter(function (record) {
                return String(record.professor_id) === id;
            }).map(function (record) { return record.dia_semana; }))).sort(function (a, b) {
                return DAYS.indexOf(a) - DAYS.indexOf(b);
            });
            return {
                professor: entry.professor,
                disciplines: Array.from(entry.disciplines.values()).sort(function (a, b) { return a.localeCompare(b, 'pt-BR'); }),
                prdDays: days
            };
        }).sort(function (a, b) {
            return String(a.professor.nome || '').localeCompare(String(b.professor.nome || ''), 'pt-BR');
        });
        return {
            course: course,
            classes: classes,
            demands: Array.from(demandsById.values()),
            teachers: teachers,
            unlinkedDisciplines: unlinkedDisciplines
        };
    }

    function renderAvailabilityPlanning() {
        const courses = activeRecords(KEYS.cursos, ['ativo', 'ativa']);
        if (!courses.some(function (course) { return String(course.id) === String(availabilityCourseId); })) availabilityCourseId = '';
        const courseOptions = courses.map(function (course) {
            return '<option value="' + h(course.id) + '"' + (String(course.id) === String(availabilityCourseId) ? ' selected' : '') + '>' +
                h(course.nome || 'Curso') + '</option>';
        }).join('');
        const scope = getAvailabilityCourseScope(availabilityCourseId, availabilitySemester);
        const teacherOptions = scope.teachers.map(function (entry) {
            return '<option value="' + h(entry.professor.id) + '">' + h(entry.professor.nome || 'Professor') + '</option>';
        }).join('');
        const teacherRows = scope.teachers.map(function (entry) {
            const prdLabels = entry.prdDays.length
                ? entry.prdDays.map(function (day) { return '<span class="availability-day-chip availability-day-chip-prd">' + h(day) + '</span>'; }).join('')
                : '<span class="badge text-bg-warning">PRD não atribuído</span>';
            return '<article class="prd-teacher-row"><div class="prd-teacher-main"><strong>' + h(entry.professor.nome || 'Professor') +
                '</strong><div class="small text-muted">' + entry.disciplines.map(h).join(' · ') + '</div></div><div class="prd-teacher-days">' +
                prdLabels + '</div><span class="badge text-bg-' + (entry.prdDays.length ? 'success' : 'warning') + '">' +
                (entry.prdDays.length ? 'Atribuído' : 'Pendente') + '</span></article>';
        }).join('');
        const missingDisciplines = scope.unlinkedDisciplines.length
            ? '<div class="alert alert-warning py-2 mb-3"><strong>Disciplinas sem professor vinculado:</strong> ' +
                scope.unlinkedDisciplines.map(function (demand) { return h(demand.disciplina_nome); }).join(', ') +
                '. Vincule professores para incluí-los no acompanhamento de PRD.</div>'
            : '';
        const summary = !availabilityCourseId
            ? '<div class="empty-state py-3"><i class="bi bi-funnel"></i>Selecione um curso para ver professores vinculados às disciplinas demandadas.</div>'
            : !scope.demands.length
                ? '<div class="alert alert-warning mb-0">Este curso não tem demandas de disciplinas no semestre selecionado. Confira as turmas e demandas cadastradas.</div>'
                : !scope.teachers.length
                    ? '<div class="empty-state py-3"><i class="bi bi-person-exclamation"></i>Nenhum professor está vinculado às disciplinas demandadas deste curso no semestre.</div>'
                    : '';
        const assignmentForm = availabilityCourseId && scope.teachers.length
            ? '<form id="prd-form" class="prd-assignment-form"><div><label class="form-label" for="prd-professor">Professor vinculado</label><select class="form-select" id="prd-professor" name="professor_id" required><option value="">Selecione</option>' +
                teacherOptions + '</select></div><div><label class="form-label" for="prd-day">Dia de PRD</label><select class="form-select" id="prd-day" name="dia_semana" required>' +
                DAYS.map(function (day) { return '<option value="' + h(day) + '">' + h(day) + '</option>'; }).join('') +
                '</select></div><button type="submit" class="btn btn-primary align-self-end"><i class="bi bi-calendar-plus me-1"></i>Atribuir PRD</button></form>'
            : '';
        return '<section class="card mb-4 prd-planning"><div class="card-header d-flex justify-content-between align-items-center gap-2 flex-wrap"><div><strong>Plano de Trabalho Docente (PRD)</strong>' +
            '<div class="small text-muted fw-normal">Registre atividades de ensino, pesquisa e extensão em dias sem aulas; cada PRD bloqueia o dia inteiro na geração da grade.</div></div>' +
            '<span class="badge text-bg-primary">Prioridade</span></div><div class="card-body">' +
            '<div class="row g-3 align-items-end mb-3"><div class="col-sm-4"><label class="form-label" for="availability-semester">Semestre</label>' +
            '<input class="form-control" id="availability-semester" value="' + h(availabilitySemester) + '" pattern="\\d{4}/[12]" placeholder="AAAA/1"></div>' +
            '<div class="col-sm-5"><label class="form-label" for="availability-course">Curso</label><select class="form-select" id="availability-course"><option value="">Selecione um curso</option>' +
            courseOptions + '</select></div><div class="col-sm-3"><button type="button" class="btn btn-outline-primary w-100" data-action="availability-apply">Consultar</button></div></div>' +
            (availabilityCourseId && scope.course ? '<p class="small text-muted">Curso: <strong>' + h(scope.course.nome) + '</strong> · ' + scope.classes.length +
                ' turma(s) · ' + scope.demands.length + ' disciplina(s) demandada(s) · ' + scope.teachers.filter(function (entry) { return entry.prdDays.length; }).length +
                ' de ' + scope.teachers.length + ' professor(es) com PRD atribuído</p>' : '') +
            missingDisciplines + assignmentForm + summary +
            (availabilityCourseId && scope.teachers.length ? '<h2 class="h6 mt-3 mb-2">Acompanhamento dos professores</h2>' + '<div class="prd-teacher-list">' + teacherRows + '</div>' : '') +
            '</div></section>';
    }

    function syncAvailabilityForm(form) {
        if (!form) return;
        const type = form.elements.namedItem('tipo');
        const slot = form.elements.namedItem('horario_id');
        const available = form.elements.namedItem('disponivel');
        const day = form.elements.namedItem('dia_semana');
        const isPrd = type && type.value === 'prd';
        if (slot && day) {
            Array.from(slot.options).forEach(function (option) {
                if (!option.value || !option.dataset.day) return;
                option.hidden = option.dataset.day !== day.value;
            });
        }
        [slot, available].forEach(function (control) {
            if (!control) return;
            const wrapper = control.closest('.col-md-6');
            if (wrapper) wrapper.hidden = isPrd;
        });
        if (isPrd) {
            if (slot) slot.value = '';
            if (available) available.value = '0';
        }
    }

    function submitPrd(form) {
        const professorId = String(form.elements.namedItem('professor_id').value || '');
        const day = String(form.elements.namedItem('dia_semana').value || '');
        const semester = availabilitySemester;
        const scope = getAvailabilityCourseScope(availabilityCourseId, semester);
        const teacher = scope.teachers.find(function (entry) { return String(entry.professor.id) === professorId; });
        if (!teacher) throw new Error('Selecione um professor vinculado às disciplinas demandadas do curso.');
        if (!DAYS.includes(day)) throw new Error('Selecione um dia válido para o PRD.');
        const records = readRecords(KEYS.disponibilidade);
        const duplicate = records.some(function (record) {
            return String(record.professor_id) === professorId &&
                String(record.tipo || '').toLowerCase() === 'prd' &&
                String(record.dia_semana) === day && semesterMatches(record, semester);
        });
        if (duplicate) throw new Error('Este professor já tem PRD atribuído nesse dia e semestre.');
        const grade = readSimulation(semester);
        const dayLessons = grade.assignments.filter(function (assignment) {
            return String(assignment.professor_id) === professorId && String(assignment.dia_semana) === day;
        });
        if (dayLessons.length) throw new Error('Este professor já tem ' + dayLessons.length + ' aula(s) na grade de ' + day +
            '. Realoque ou remova essas aulas antes de registrar o PRD.');
        records.push({
            id: nextId(records),
            professor_id: Number(professorId),
            dia_semana: day,
            horario_id: null,
            disponivel: 0,
            tipo: 'prd',
            semestre_letivo: semester
        });
        saveRecords(KEYS.disponibilidade, records, 'ProfessorDisponibilidade');
        render();
        notify('PRD de ' + teacher.professor.nome + ' registrado para ' + day + ' no semestre ' + semester + '.', 'success');
    }

    function renderSchedulePlanning(records) {
        const sorted = records.slice().sort(function (a, b) {
            return DAYS.indexOf(a.dia_semana) - DAYS.indexOf(b.dia_semana) ||
                String(a.hora_inicio || '').localeCompare(String(b.hora_inicio || ''));
        });
        const conflicts = new Set();
        sorted.forEach(function (slot, index) {
            sorted.slice(index + 1).forEach(function (other) {
                if (slot.dia_semana === other.dia_semana &&
                    String(slot.hora_inicio || '') < String(other.hora_fim || '') &&
                    String(slot.hora_fim || '') > String(other.hora_inicio || '')) {
                    conflicts.add(String(slot.id));
                    conflicts.add(String(other.id));
                }
            });
        });
        const lessons = sorted.filter(function (slot) { return String(slot.tipo || 'Aula').toLowerCase() === 'aula'; }).length;
        const breaks = sorted.length - lessons;
        const configuredDays = new Set(sorted.map(function (slot) { return slot.dia_semana; })).size;
        const days = WEEKDAYS.concat(DAYS.slice(5).filter(function (day) {
            return sorted.some(function (slot) { return slot.dia_semana === day; });
        }));
        const stats = [
            ['Períodos de aula', lessons, 'bi-easel2', 'schedule-stat-class'],
            ['Intervalos', breaks, 'bi-cup-hot', 'schedule-stat-break'],
            ['Dias configurados', configuredDays, 'bi-calendar-week', 'schedule-stat-days'],
            ['Períodos em conflito', conflicts.size, 'bi-exclamation-triangle', conflicts.size ? 'schedule-stat-conflict' : 'schedule-stat-ok']
        ].map(function (item) {
            return '<div class="col-6 col-xl-3"><div class="schedule-stat ' + item[3] + '"><span><i class="bi ' + item[2] + '"></i>' +
                h(item[0]) + '</span><strong>' + h(item[1]) + '</strong></div></div>';
        }).join('');
        const dayCards = days.map(function (day) {
            const daySlots = sorted.filter(function (slot) { return slot.dia_semana === day; });
            const items = daySlots.length ? daySlots.map(function (slot) {
                const minutes = Math.max(0, (Number(String(slot.hora_fim || '').slice(0, 2)) * 60 +
                    Number(String(slot.hora_fim || '').slice(3, 5))) -
                    (Number(String(slot.hora_inicio || '').slice(0, 2)) * 60 +
                    Number(String(slot.hora_inicio || '').slice(3, 5))));
                const conflict = conflicts.has(String(slot.id));
                return '<div class="schedule-period' + (conflict ? ' has-conflict' : '') + '"><div class="schedule-period-time">' +
                    '<strong>' + h(slot.hora_inicio || '—') + '–' + h(slot.hora_fim || '—') + '</strong>' +
                    '<small>' + h(minutes) + ' min</small></div><div class="schedule-period-detail">' + scheduleTypeBadge(slot.tipo) +
                    (conflict ? '<span class="schedule-conflict-label"><i class="bi bi-exclamation-triangle-fill"></i>Sobreposição</span>' : '') +
                    '</div><button type="button" class="btn btn-sm btn-outline-primary" data-action="edit" data-id="' + h(slot.id) +
                    '" aria-label="Editar período de ' + h(day) + ' ' + h(slot.hora_inicio) + '"><i class="bi bi-pencil"></i></button></div>';
            }).join('') : '<div class="schedule-day-empty">Sem períodos configurados</div>';
            return '<section class="schedule-day-card"><header><h2>' + h(day) + '</h2><span>' + daySlots.length +
                ' período(s)</span></header><div class="schedule-period-list">' + items + '</div></section>';
        }).join('');
        return '<section class="schedule-planner card mb-4"><div class="card-header d-flex justify-content-between align-items-center gap-2 flex-wrap">' +
            '<div><strong>Visão semanal dos horários</strong><div class="small text-muted fw-normal">Confira períodos, intervalos e possíveis sobreposições por dia.</div></div>' +
            '<span class="schedule-type-badge schedule-type-class">Aula</span><span class="schedule-type-badge schedule-type-break">Intervalo</span></div>' +
            '<div class="card-body"><div class="row g-2 mb-3">' + stats + '</div>' +
            (conflicts.size ? '<div class="alert alert-warning py-2"><i class="bi bi-exclamation-triangle me-1"></i>Há horários sobrepostos no mesmo dia. Edite os períodos destacados para evitar conflitos na grade.</div>' : '') +
            '<div class="schedule-week-grid">' + dayCards + '</div></div></section>';
    }

    function noteStatusLabel(status) {
        const labels = { standby: 'A fazer', andamento: 'Em andamento', concluido: 'Concluído' };
        return labels[status] || labels.standby;
    }

    function notePriorityLabel(priority) {
        const labels = { baixa: 'Baixa', media: 'Média', alta: 'Alta' };
        return labels[priority] || labels.media;
    }

    function renderNotes() {
        const records = readRecords(KEYS.notas).slice().sort(function (a, b) {
            return String(b.updated_at || b.created_at || '').localeCompare(String(a.updated_at || a.created_at || ''));
        });
        const fields = specs.notas.fields.map(function (field) {
            const value = editing && editing.route === 'notas' ? editing.record[field.name] : undefined;
            return renderField(field, value);
        }).join('');
        const todayDate = new Date();
        const today = todayDate.getFullYear() + '-' + String(todayDate.getMonth() + 1).padStart(2, '0') + '-' +
            String(todayDate.getDate()).padStart(2, '0');
        const overdue = records.filter(function (note) {
            return note.status !== 'concluido' && note.prazo && note.prazo < today;
        }).length;
        const statusColumns = [
            ['standby', 'A fazer', 'bi-inbox'],
            ['andamento', 'Em andamento', 'bi-arrow-repeat'],
            ['concluido', 'Concluído', 'bi-check2-circle']
        ];
        const notesBoard = statusColumns.map(function (column) {
            const notes = records.filter(function (note) {
                return (note.status || 'standby') === column[0];
            });
            const cards = notes.length ? notes.map(function (note) {
                const color = normalizeCatalogValue(note.cor || 'azul').replace(/[^a-z0-9]+/g, '-');
                const priority = note.prioridade || 'media';
                const due = note.prazo
                    ? '<span class="note-due' + (note.status !== 'concluido' && note.prazo < today ? ' is-overdue' : '') + '">' +
                        '<i class="bi bi-calendar-event"></i>' + h(new Date(note.prazo + 'T00:00:00').toLocaleDateString('pt-BR')) +
                        (note.status !== 'concluido' && note.prazo < today ? ' · vencida' : '') + '</span>'
                    : '';
                const nextStatus = column[0] === 'standby' ? 'andamento' : column[0] === 'andamento' ? 'concluido' : 'standby';
                const nextLabel = column[0] === 'concluido' ? 'Reabrir' : column[0] === 'andamento' ? 'Concluir' : 'Iniciar';
                return '<article class="note-card note-color-' + h(color) + '" data-note-search="' +
                    h([note.titulo, note.texto, notePriorityLabel(priority)].join(' ').toLocaleLowerCase('pt-BR')) + '">' +
                    '<div class="note-card-top"><span class="note-priority note-priority-' + h(priority) + '">' +
                    h(notePriorityLabel(priority)) + '</span><div class="note-card-actions">' +
                    '<button type="button" class="btn btn-sm btn-light" data-action="edit" data-id="' + h(note.id) + '" aria-label="Editar nota"><i class="bi bi-pencil"></i></button>' +
                    '<button type="button" class="btn btn-sm btn-light text-danger" data-action="delete" data-id="' + h(note.id) + '" aria-label="Excluir nota"><i class="bi bi-trash"></i></button></div></div>' +
                    '<h3>' + h(note.titulo || 'Sem título') + '</h3><p>' + h(note.texto || '') + '</p><div class="note-card-meta">' + due +
                    '<span>Atualizada ' + h(formatDate(note.updated_at || note.created_at)) + '</span></div>' +
                    '<button type="button" class="btn btn-sm btn-outline-primary note-next-action" data-action="note-status" data-id="' +
                    h(note.id) + '" data-status="' + h(nextStatus) + '">' + h(nextLabel) + '</button></article>';
            }).join('') : '<div class="notes-column-empty">Nenhuma anotação nesta etapa.</div>';
            return '<section class="notes-column notes-column-' + h(column[0]) + '"><header><h2><i class="bi ' + column[2] +
                '"></i>' + h(column[1]) + '</h2><span>' + notes.length + '</span></header><div class="notes-column-body">' + cards + '</div></section>';
        }).join('');
        const heading = editing && editing.route === 'notas' ? 'Editar anotação' : 'Nova anotação';
        return pageHeader('Bloco de notas', 'bi-journal-richtext', 'Organize decisões, tarefas e lembretes em um quadro visual.') +
            '<section class="notes-summary row g-2 mb-3"><div class="col-6 col-lg-3"><div><span>Total de notas</span><strong>' + records.length +
            '</strong></div></div><div class="col-6 col-lg-3"><div><span>A fazer</span><strong>' + records.filter(function (note) { return !note.status || note.status === 'standby'; }).length +
            '</strong></div></div><div class="col-6 col-lg-3"><div><span>Em andamento</span><strong>' + records.filter(function (note) { return note.status === 'andamento'; }).length +
            '</strong></div></div><div class="col-6 col-lg-3"><div class="' + (overdue ? 'has-overdue' : '') + '"><span>Prazos vencidos</span><strong>' + overdue +
            '</strong></div></div></section>' +
            '<section class="card mb-4 notes-editor"><div class="card-header d-flex justify-content-between align-items-center gap-2"><strong>' + heading +
            '</strong><span class="small text-muted">As notas ficam salvas neste navegador.</span></div><div class="card-body">' +
            '<form id="record-form" data-route="notas"><div class="row g-3">' + fields + '</div><div class="d-flex gap-2 mt-3">' +
            '<button class="btn btn-primary" type="submit"><i class="bi bi-save me-1"></i>' + (editing && editing.route === 'notas' ? 'Salvar alterações' : 'Adicionar nota') + '</button>' +
            (editing && editing.route === 'notas' ? '<button class="btn btn-outline-secondary" type="button" data-action="cancel-edit">Cancelar</button>' : '') +
            '</div></form></div></section>' +
            '<div class="d-flex flex-wrap justify-content-between align-items-end gap-2 mb-3"><div><h2 class="h5 mb-1">Quadro de anotações</h2>' +
            '<p class="small text-muted mb-0">Defina prioridade e prazo; avance cada cartão conforme a tarefa evolui.</p></div>' +
            '<div><label class="form-label mb-1" for="notes-search">Buscar nas anotações</label><input id="notes-search" class="form-control form-control-sm" type="search" placeholder="Título, texto ou prioridade"></div></div>' +
            '<div class="notes-board">' + notesBoard + '</div>';
    }

    function renderCrud(route) {
        const spec = specs[route];
        let records = readRecords(spec.key);
        if (route === 'disponibilidade') {
            const scopedTeacherIds = availabilityCourseId
                ? new Set(getAvailabilityCourseScope(availabilityCourseId, availabilitySemester).teachers.map(function (entry) {
                    return String(entry.professor.id);
                }))
                : null;
            records = records.filter(function (record) {
                if (!semesterMatches(record, availabilitySemester)) return false;
                if (!availabilityCourseId) return true;
                return scopedTeacherIds.has(String(record.professor_id));
            });
        }
        records = records.slice().sort(function (a, b) {
            if (route === 'horarios') {
                return DAYS.indexOf(a.dia_semana) - DAYS.indexOf(b.dia_semana) ||
                    String(a.hora_inicio || '').localeCompare(String(b.hora_inicio || ''));
            }
            return String(a.nome || a.titulo || a.dia_semana || '').localeCompare(String(b.nome || b.titulo || ''), 'pt-BR');
        });
        const isEditing = editing && editing.route === route;
        const fields = spec.fields.map(function (field) {
            let value = isEditing ? editing.record[field.name] : undefined;
            if (route === 'disponibilidade' && field.name === 'semestre_letivo' && !isEditing) value = availabilitySemester;
            if (isEditing && route === 'professores' && field.name === 'disciplina_ingresso' && !value && editing.record.disciplina_ingresso_id) {
                value = nameById(KEYS.disciplinas, editing.record.disciplina_ingresso_id, '');
            }
            return renderField(field, value);
        }).join('');
        const rows = records.map(function (record) {
            const cells = spec.columns.map(function (column) {
                const value = record[column[0]];
                return '<td>' + (column[2] ? column[2](value, record) : h(value == null || value === '' ? '—' : value)) + '</td>';
            }).join('');
            const filterAttributes = getRecordFilterDefinitions(route).map(function (filter) {
                return ' data-filter-' + h(filter.name) + '="' + h(getRecordFilterValue(route, filter.name, record)) + '"';
            }).join('');
            const demandLessonsAttribute = route === 'demandas'
                ? ' data-demand-lessons="' + h(Number(record.aulas_semanais || record.aulas_previstas || 0)) + '"'
                : '';
            return '<tr' + filterAttributes + demandLessonsAttribute + '>' + cells + '<td><div class="table-actions">' +
                '<button type="button" class="btn btn-sm btn-outline-primary" data-action="edit" data-id="' + h(record.id) + '" aria-label="Editar"><i class="bi bi-pencil"></i></button>' +
                '<button type="button" class="btn btn-sm btn-outline-danger" data-action="delete" data-id="' + h(record.id) + '" aria-label="Excluir"><i class="bi bi-trash"></i></button>' +
                '</div></td></tr>';
        }).join('');
        const emptyCols = spec.columns.length + 1;
        const recordFilters = renderRecordFilters(route, records);
        const totalDemandLessons = records.reduce(function (total, record) {
            return total + Number(record.aulas_semanais || record.aulas_previstas || 0);
        }, 0);
        const scheduleCopy = route === 'horarios'
            ? '<div class="card mb-4"><div class="card-header">Duplicar horários de um dia</div><div class="card-body">' +
                '<p class="text-muted">Copie todos os períodos, incluindo intervalos, para outros dias. Horários que coincidirem ou se sobrepuserem aos já cadastrados serão ignorados.</p>' +
                '<form id="copy-schedule-form"><div class="row g-3 align-items-end">' +
                '<div class="col-md-4"><label class="form-label" for="copy-schedule-source">Copiar horários de</label><select class="form-select" id="copy-schedule-source" name="source" required>' +
                DAYS.map(function (day) { return '<option value="' + h(day) + '">' + h(day) + '</option>'; }).join('') +
                '</select></div><fieldset class="col-md-8"><legend class="form-label">Duplicar para</legend><div class="d-flex flex-wrap gap-3">' +
                DAYS.map(function (day) {
                    return '<label class="form-check"><input class="form-check-input" type="checkbox" name="target" value="' + h(day) + '"><span class="form-check-label">' + h(day) + '</span></label>';
                }).join('') +
                '</div></fieldset><div class="col-12"><button class="btn btn-outline-primary" type="submit"><i class="bi bi-copy me-1"></i>Duplicar horários</button></div>' +
                '</div></form></div></div>'
            : '';
        const schedulePlanning = route === 'horarios' ? renderSchedulePlanning(records) : '';
        const bulkDemandForm = route === 'demandas' ? renderBulkDemandForm() : '';
        const coverage = route === 'vinculos' ? renderVinculoCoverage() : '';
        const availabilityPlanning = route === 'disponibilidade' ? renderAvailabilityPlanning() : '';
        const spreadsheetTools = '<div class="card mb-4"><div class="card-header">Editar registros com planilha</div><div class="card-body">' +
            '<p class="text-muted">Baixe os registros atuais em XLSX, edite as linhas e envie a planilha para revisar as alterações antes de aplicar. Preserve a coluna ID; deixe-a vazia apenas para adicionar novos registros.</p>' +
            '<div class="d-flex flex-wrap gap-2"><button class="btn btn-outline-primary" type="button" data-action="download-current-spreadsheet"><i class="bi bi-file-earmark-spreadsheet me-1"></i>Baixar XLSX preenchido</button>' +
            '<button class="btn btn-outline-secondary" type="button" data-action="pick-current-spreadsheet"><i class="bi bi-upload me-1"></i>Enviar XLSX editado</button>' +
            '<input id="current-spreadsheet-file" class="d-none" type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"></div></div></div>';
        const importGuidance = route === 'disciplinas' || route === 'turmas'
            ? (readRecords(KEYS.cursos).length
                ? 'A lista de cursos do XLSX reflete os cursos cadastrados no momento em que o modelo é baixado.'
                : 'Cadastre cursos antes de baixar o XLSX para incluir as opções de curso no menu suspenso.')
            : 'No XLSX, o status também tem lista suspensa.';
        const importTools = catalogImportSchemas[route]
            ? '<div class="card mb-4"><div class="card-header">Importar cadastro por planilha</div><div class="card-body">' +
                '<p class="text-muted">Baixe um modelo, preencha uma linha por registro e envie o arquivo para revisar antes de importar. Se a planilha tiver a coluna ID, IDs existentes atualizam os registros; deixe o ID vazio para criar novos.</p>' +
                '<div class="d-flex flex-wrap gap-2"><button class="btn btn-outline-primary" type="button" data-action="download-catalog-template" data-format="xlsx"><i class="bi bi-file-earmark-spreadsheet me-1"></i>Baixar modelo XLSX com listas</button>' +
                '<button class="btn btn-outline-secondary" type="button" data-action="download-catalog-template" data-format="csv"><i class="bi bi-download me-1"></i>Baixar modelo CSV</button>' +
                '<button class="btn btn-primary" type="button" data-action="pick-catalog-import"><i class="bi bi-upload me-1"></i>Enviar CSV ou XLSX</button>' +
                '<input id="catalog-import-file" class="d-none" type="file" accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"></div>' +
                '<div class="form-text mt-2">' + h(importGuidance) + (route === 'professores' ? ' Para professores, o XLSX também oferece listas de titulação, carga semanal e limite diário.' : '') + ' CSV não oferece menus suspensos.</div></div></div>'
            : '';
        return pageHeader(spec.title, spec.icon, descriptionFor(route)) +
            availabilityPlanning +
            importTools +
            spreadsheetTools +
            renderSpreadsheetImport(route) +
            renderCatalogImport(route) +
            coverage +
            bulkDemandForm +
            schedulePlanning +
            '<div class="card mb-4"><div class="card-header">' + (isEditing ? 'Editar registro' : 'Novo registro') + '</div><div class="card-body">' +
            '<form id="record-form" data-route="' + route + '"><div class="row g-3">' + fields + '</div>' +
            '<div class="d-flex gap-2 mt-3"><button class="btn btn-primary" type="submit"><i class="bi bi-save me-1"></i>' + (isEditing ? 'Salvar alterações' : 'Salvar') + '</button>' +
            (isEditing ? '<button class="btn btn-outline-secondary" type="button" data-action="cancel-edit">Cancelar</button>' : '') + '</div></form></div></div>' +
            scheduleCopy +
            '<div class="card"><div class="card-header d-flex align-items-center justify-content-between gap-2 flex-wrap"><strong>Registros (<span id="table-visible-count">' + records.length + '</span>)' +
            (route === 'demandas' ? ' · <span id="demand-visible-lessons">' + totalDemandLessons + '</span> aulas semanais previstas' : '') + '</strong>' +
            '<input id="table-search" class="form-control form-control-sm" style="max-width:260px" type="search" placeholder="Filtrar registros" aria-label="Filtrar registros"></div>' +
            recordFilters +
            '<div class="table-responsive"><table class="table table-hover align-middle mb-0"><thead><tr>' +
            spec.columns.map(function (column) { return '<th>' + h(column[1]) + '</th>'; }).join('') + '<th class="text-end">Ações</th></tr></thead><tbody>' +
            (rows || '<tr><td colspan="' + emptyCols + '"><div class="empty-state"><i class="bi bi-inbox"></i>Nenhum registro. Use o formulário acima para começar.</div></td></tr>') +
            (rows ? '<tr id="record-filter-empty" hidden><td colspan="' + emptyCols + '"><div class="empty-state"><i class="bi bi-funnel"></i>Nenhum registro encontrado com esses filtros.</div></td></tr>' : '') +
            '</tbody></table></div></div>';
    }

    function getRecordFilterDefinitions(route) {
        const filters = {
            cursos: [
                { name: 'nome', label: 'Nome', type: 'text' },
                { name: 'sigla', label: 'Sigla', type: 'text' },
                { name: 'status', label: 'Status', type: 'select' }
            ],
            professores: [
                { name: 'nome', label: 'Professor', type: 'text' },
                { name: 'disciplina_ingresso', label: 'Disciplina de ingresso', type: 'text' },
                { name: 'matricula', label: 'Matrícula', type: 'text' },
                { name: 'email', label: 'E-mail', type: 'text' },
                { name: 'telefone', label: 'Telefone', type: 'text' },
                { name: 'titulacao', label: 'Titulação', type: 'select' },
                { name: 'carga_horaria_semanal', label: 'Carga semanal', type: 'range' },
                { name: 'limite_aulas_dia', label: 'Limite diário', type: 'range' },
                { name: 'status', label: 'Status', type: 'select' }
            ],
            disciplinas: [
                { name: 'nome', label: 'Disciplina', type: 'text' },
                { name: 'curso_id', label: 'Curso', type: 'select' },
                { name: 'status', label: 'Status', type: 'select' }
            ],
            turmas: [
                { name: 'nome', label: 'Turma', type: 'text' },
                { name: 'curso_id', label: 'Curso', type: 'select' },
                { name: 'ano_letivo', label: 'Ano letivo', type: 'select' },
                { name: 'periodo', label: 'Período/turno', type: 'select' },
                { name: 'semestre_letivo', label: 'Semestre', type: 'select' },
                { name: 'status', label: 'Status', type: 'select' }
            ],
            horarios: [
                { name: 'dia_semana', label: 'Dia da semana', type: 'select' },
                { name: 'tipo', label: 'Tipo', type: 'select' },
                { name: 'hora_inicio', label: 'A partir de', type: 'time' },
                { name: 'hora_fim', label: 'Até', type: 'time' }
            ],
            vinculos: [
                { name: 'professor_id', label: 'Professor', type: 'select' },
                { name: 'disciplina_id', label: 'Disciplina', type: 'select' },
                { name: 'semestre_letivo', label: 'Semestre', type: 'select' }
            ],
            disponibilidade: [
                { name: 'professor_id', label: 'Professor', type: 'select' },
                { name: 'dia_semana', label: 'Dia', type: 'select' },
                { name: 'tipo', label: 'Registro', type: 'select' },
                { name: 'horario_id', label: 'Horário', type: 'select' },
                { name: 'disponivel', label: 'Situação', type: 'select' },
                { name: 'semestre_letivo', label: 'Semestre', type: 'select' }
            ],
            demandas: [
                { name: 'turma_id', label: 'Turma', type: 'select' },
                { name: 'curso_id', label: 'Curso', type: 'select' },
                { name: 'semestre_letivo', label: 'Semestre', type: 'select' },
                { name: 'disciplina_id', label: 'Disciplina', type: 'select' },
                { name: 'aulas_semanais', label: 'Aulas por semana', type: 'range' }
            ],
            notas: [
                { name: 'titulo', label: 'Título', type: 'text' },
                { name: 'texto', label: 'Texto', type: 'text' },
                { name: 'status', label: 'Coluna', type: 'select' },
                { name: 'cor', label: 'Cor', type: 'select' },
                { name: 'updated_at', label: 'Atualizado a partir de', type: 'date' }
            ]
        };
        return filters[route] || [];
    }

    function getRecordFilterValue(route, name, record) {
        if (route === 'demandas' && name === 'curso_id') {
            const turma = findById(KEYS.turmas, record.turma_id);
            if (!turma) return '';
            if (turma.curso_id) return String(turma.curso_id);
            const course = readRecords(KEYS.cursos).find(function (item) {
                return normalizeCatalogValue(item.nome) === normalizeCatalogValue(turma.curso_nome);
            });
            return course ? String(course.id) : '';
        }
        if (route === 'disponibilidade' && name === 'tipo') return String(record.tipo || 'indisponibilidade');
        if (route === 'horarios' && name === 'tipo') return String(record.tipo || 'Aula');
        if (route === 'disponibilidade' && name === 'disponivel') {
            return String(record.tipo || '').toLowerCase() === 'prd'
                ? 'prd'
                : Number(record.disponivel) === 1 ? '1' : '0';
        }
        if (route === 'disponibilidade' && name === 'horario_id') return String(record.horario_id || '');
        if (name === 'semestre_letivo') return String(record.semestre_letivo || '').trim();
        if (route === 'professores' && name === 'disciplina_ingresso') return teacherIngressName(record);
        return record[name] == null ? '' : String(record[name]).trim();
    }

    function getRecordFilterLabel(route, name, value) {
        if (route === 'disponibilidade' && name === 'horario_id') {
            if (!value) return 'Dia todo';
            const slot = findById(KEYS.horarios, value);
            return slot ? slot.dia_semana + ' · ' + slot.hora_inicio + '–' + slot.hora_fim : 'Horário ' + value;
        }
        const idLookups = {
            curso_id: KEYS.cursos,
            disciplina_id: KEYS.disciplinas,
            turma_id: KEYS.turmas,
            professor_id: KEYS.professores
        };
        if (idLookups[name]) return nameById(idLookups[name], value, 'Registro ' + value);
        if (route === 'disponibilidade' && name === 'tipo') {
            return String(value).toLowerCase() === 'prd' ? 'PRD · dia todo' : 'Indisponibilidade';
        }
        if (route === 'disponibilidade' && name === 'disponivel') {
            return value === 'prd' ? 'PRD · sem aulas' : value === '1' ? 'Disponível' : 'Indisponível';
        }
        if (route === 'horarios' && name === 'tipo') return String(value || 'Aula');
        if (name === 'semestre_letivo' && !value) return 'Não informado';
        if (name === 'tipo' && route === 'notas') return value;
        return value || 'Não informado';
    }

    function renderRecordFilters(route, records) {
        if (!records.length) return '';
        const definitions = getRecordFilterDefinitions(route);
        if (!definitions.length) return '';
        const controls = definitions.map(function (filter) {
            const id = 'record-filter-' + filter.name;
            if (filter.type === 'select') {
                const values = Array.from(new Set(records.map(function (record) {
                    return getRecordFilterValue(route, filter.name, record);
                }))).sort(function (a, b) { return a.localeCompare(b, 'pt-BR', { numeric: true }); });
                const options = '<option value="">Todos</option>' + values.map(function (value) {
                    const optionValue = value || '__owltime_empty__';
                    return '<option value="' + h(optionValue) + '">' + h(getRecordFilterLabel(route, filter.name, value)) + '</option>';
                }).join('');
                return '<div class="col-sm-6 col-lg-3"><label class="form-label mb-1" for="' + id + '">' + h(filter.label) +
                    '</label><select class="form-select form-select-sm record-filter-control" id="' + id + '" data-filter-name="' +
                    h(filter.name) + '">' + options + '</select></div>';
            }
            if (filter.type === 'range') {
                return '<div class="col-sm-6 col-lg-3"><label class="form-label mb-1" for="' + id + '-min">' + h(filter.label) +
                    '</label><div class="input-group input-group-sm"><input class="form-control record-filter-control" id="' + id +
                    '-min" data-filter-name="' + h(filter.name) + '" data-filter-bound="min" type="number" min="0" placeholder="Mín.">' +
                    '<input class="form-control record-filter-control" id="' + id + '-max" data-filter-name="' + h(filter.name) +
                    '" data-filter-bound="max" type="number" min="0" placeholder="Máx."></div></div>';
            }
            const inputType = filter.type === 'date' || filter.type === 'time' ? filter.type : 'search';
            return '<div class="col-sm-6 col-lg-3"><label class="form-label mb-1" for="' + id + '">' + h(filter.label) +
                '</label><input class="form-control form-control-sm record-filter-control" id="' + id + '" data-filter-name="' +
                h(filter.name) + '" type="' + inputType + '" placeholder="' +
                h(filter.type === 'time' ? 'Qualquer horário' : filter.type === 'date' ? 'Qualquer data' : 'Contém...') + '"></div>';
        }).join('');
        return '<div class="record-filter-panel px-3 pt-3"><div class="row g-2 align-items-end">' + controls +
            '<div class="col-sm-6 col-lg-3"><button class="btn btn-sm btn-outline-secondary" type="button" data-action="clear-record-filters">' +
            '<i class="bi bi-x-circle me-1"></i>Limpar filtros</button></div></div></div>';
    }

    function applyRecordFilters() {
        const route = window.location.hash.replace(/^#\/?/, '').split('/')[0] || '';
        const definitions = getRecordFilterDefinitions(route);
        const rows = Array.from(document.querySelectorAll('#view tbody tr[data-filter-' + definitions[0].name + ']'));
        const query = String(document.getElementById('table-search').value || '').trim().toLocaleLowerCase('pt-BR');
        let visible = 0;
        rows.forEach(function (row) {
            const matchesFilters = definitions.every(function (filter) {
                const value = row.dataset['filter' + filter.name.charAt(0).toUpperCase() + filter.name.slice(1)] || '';
                if (filter.type === 'select') {
                    const selected = document.getElementById('record-filter-' + filter.name).value;
                    return !selected || (selected === '__owltime_empty__' ? !value : value === selected);
                }
                if (filter.type === 'range') {
                    const minimum = document.getElementById('record-filter-' + filter.name + '-min').value;
                    const maximum = document.getElementById('record-filter-' + filter.name + '-max').value;
                    const numericValue = Number(value);
                    return (!minimum || numericValue >= Number(minimum)) && (!maximum || numericValue <= Number(maximum));
                }
                const filterValue = document.getElementById('record-filter-' + filter.name).value;
                if (!filterValue) return true;
                if (filter.type === 'date') return value.slice(0, 10) >= filterValue;
                if (filter.type === 'time') {
                    return filter.name === 'hora_inicio' ? value >= filterValue : value <= filterValue;
                }
                return value.toLocaleLowerCase('pt-BR').includes(filterValue.trim().toLocaleLowerCase('pt-BR'));
            });
            const matches = matchesFilters && (!query || row.textContent.toLocaleLowerCase('pt-BR').includes(query));
            row.hidden = !matches;
            if (matches) visible += 1;
        });
        const count = document.getElementById('table-visible-count');
        if (count) count.textContent = String(visible);
        if (route === 'demandas') {
            const lessonTotal = rows.reduce(function (total, row) {
                return total + (row.hidden ? 0 : Number(row.dataset.demandLessons || 0));
            }, 0);
            const lessonCount = document.getElementById('demand-visible-lessons');
            if (lessonCount) lessonCount.textContent = String(lessonTotal);
        }
        const emptyState = document.getElementById('record-filter-empty');
        if (emptyState) emptyState.hidden = visible > 0;
    }

    function renderBulkDemandForm() {
        const classes = readRecords(KEYS.turmas).slice().sort(function (a, b) {
            return String(a.nome || '').localeCompare(String(b.nome || ''), 'pt-BR');
        });
        const classOptions = classes.length
            ? classes.map(function (turma) {
                return '<label class="form-check"><input class="form-check-input" type="checkbox" name="turma_ids" value="' + h(turma.id) + '">' +
                    '<span class="form-check-label">' + h(turma.nome || ('Turma ' + turma.id)) + '</span></label>';
            }).join('')
            : '<p class="text-muted mb-0">Cadastre turmas antes de criar demandas em lote.</p>';
        const disciplineOptions = fieldOptions(specs.demandas.fields.find(function (field) { return field.name === 'disciplina_id'; }));
        return '<div class="card mb-4"><div class="card-header">Aplicar a várias turmas</div><div class="card-body">' +
            '<p class="text-muted">Selecione as turmas que terão a mesma disciplina e quantidade de aulas semanais.</p>' +
            '<form id="bulk-demand-form"><fieldset class="mb-3"><legend class="form-label">Turmas</legend>' +
            '<div class="d-flex justify-content-end mb-2"><button class="btn btn-sm btn-outline-secondary" type="button" data-action="toggle-demand-classes">Marcar/desmarcar todas</button></div>' +
            '<div class="row row-cols-1 row-cols-sm-2 row-cols-lg-3 g-2">' + classOptions + '</div></fieldset>' +
            '<div class="row g-3"><div class="col-md-4"><label class="form-label" for="bulk-demand-discipline">Disciplina *</label>' +
            '<select class="form-select" id="bulk-demand-discipline" name="disciplina_id" required><option value="">Selecione</option>' +
            disciplineOptions.map(function (option) { return '<option value="' + h(option[0]) + '">' + h(option[1]) + '</option>'; }).join('') +
            '</select></div><div class="col-md-4"><label class="form-label" for="bulk-demand-lessons">Aulas por semana *</label>' +
            '<input class="form-control" id="bulk-demand-lessons" name="aulas_semanais" type="number" min="1" step="1" value="1" required></div>' +
            '<div class="col-md-4"><label class="form-label" for="bulk-demand-semester">Semestre letivo</label>' +
            '<input class="form-control" id="bulk-demand-semester" name="semestre_letivo" value="' + h(getSemester()) + '" placeholder="AAAA/1"></div>' +
            '<div class="col-12"><button class="btn btn-primary" type="submit"><i class="bi bi-plus-square me-1"></i>Gerar demandas para as turmas</button></div>' +
            '</div></form></div></div>';
    }

    function submitBulkDemand(form) {
        const turmaIds = Array.from(form.querySelectorAll('input[name="turma_ids"]:checked')).map(function (input) { return Number(input.value); });
        const disciplinaId = Number(form.elements.namedItem('disciplina_id').value || 0);
        const aulasSemanais = Number(form.elements.namedItem('aulas_semanais').value || 0);
        const semestre = String(form.elements.namedItem('semestre_letivo').value || '').trim();
        if (!turmaIds.length) throw new Error('Selecione pelo menos uma turma.');
        if (!disciplinaId || !findById(KEYS.disciplinas, disciplinaId)) throw new Error('Selecione uma disciplina válida.');
        if (!Number.isInteger(aulasSemanais) || aulasSemanais < 1) throw new Error('Informe ao menos uma aula por semana.');

        const records = readRecords(KEYS.demandas);
        const additions = [];
        let skipped = 0;
        turmaIds.forEach(function (turmaId) {
            const duplicate = records.some(function (row) {
                return String(row.turma_id) === String(turmaId) &&
                    String(row.disciplina_id) === String(disciplinaId) &&
                    semesterMatches(row) && String(row.semestre_letivo || '') === semestre;
            });
            if (duplicate) {
                skipped += 1;
                return;
            }
            additions.push({
                id: nextId(records.concat(additions)),
                turma_id: turmaId,
                disciplina_id: disciplinaId,
                aulas_semanais: aulasSemanais,
                semestre_letivo: semestre
            });
        });
        if (!additions.length) throw new Error('As turmas selecionadas já têm essa demanda neste semestre. Edite os registros existentes para alterar a quantidade.');
        saveRecords(KEYS.demandas, records.concat(additions), specs.demandas.module);
        render();
        notify(additions.length + ' demanda(s) criada(s).' + (skipped ? ' ' + skipped + ' turma(s) ignorada(s) por já possuir essa demanda.' : ''), 'success');
    }

    function copySchedule(form) {
        const sourceDay = form.elements.namedItem('source').value;
        const targetDays = Array.from(form.querySelectorAll('input[name="target"]:checked')).map(function (input) { return input.value; });
        if (!targetDays.length) throw new Error('Selecione pelo menos um dia de destino.');
        if (targetDays.includes(sourceDay)) throw new Error('O dia de origem não pode ser selecionado como destino.');

        const records = readRecords(KEYS.horarios);
        const sourceSlots = records.filter(function (slot) { return slot.dia_semana === sourceDay; });
        if (!sourceSlots.length) throw new Error('Não há horários cadastrados no dia de origem.');

        let id = nextId(records);
        let copied = 0;
        let skipped = 0;
        const additions = [];
        targetDays.forEach(function (day) {
            const existing = records.filter(function (slot) { return slot.dia_semana === day; });
            sourceSlots.forEach(function (source) {
                const collision = existing.some(function (slot) {
                    return source.hora_inicio < slot.hora_fim && source.hora_fim > slot.hora_inicio;
                });
                if (collision) {
                    skipped += 1;
                    return;
                }
                additions.push(Object.assign({}, source, { id: id, dia_semana: day }));
                id += 1;
                copied += 1;
            });
        });
        if (!copied) throw new Error('Nenhum horário foi copiado: todos os períodos já existem ou conflitam com os dias selecionados.');
        saveRecords(KEYS.horarios, records.concat(additions), specs.horarios.module);
        render();
        notify(copied + ' horário(s) duplicado(s).' + (skipped ? ' ' + skipped + ' período(s) ignorado(s) por já existir ou conflitar.' : ''), 'success');
    }

    function descriptionFor(route) {
        const descriptions = {
            cursos: 'Cadastre e mantenha os cursos usados nas turmas.',
            professores: 'Dados e limites semanais usados no planejamento da grade.',
            disciplinas: 'Catálogo de disciplinas associado aos cursos.',
            turmas: 'Turmas, semestre e turno que receberão as aulas.',
            horarios: 'Defina os períodos de aula e intervalos da escola.',
            vinculos: 'Indique quais disciplinas cada professor pode ministrar e acompanhe a cobertura do semestre selecionado.',
            disponibilidade: 'Planeje os dias de PRD e registre indisponibilidades por horário ou dia completo.',
            demandas: 'Defina quantas aulas semanais de cada disciplina cada turma precisa.',
            peculiaridades: 'Cadastre tipos de proteção e marque os períodos reservados de cada turma antes de gerar a grade.',
            eventos: 'Cadastre eventos recorrentes que, ao serem marcados na Grade oficial, bloqueiam o mesmo horário nas turmas do turno compatível.',
            notas: 'Observações, pendências e decisões salvas apenas neste navegador.'
        };
        return descriptions[route] || '';
    }

    function subjectColor(disciplineId) {
        const key = String(disciplineId || '');
        let hash = 0;
        for (let index = 0; index < key.length; index += 1) hash = (hash * 31 + key.charCodeAt(index)) >>> 0;
        return SUBJECT_COLORS[hash % SUBJECT_COLORS.length];
    }

    function slotMatchesClassPeriod(turma, slot) {
        const period = normalizeCatalogValue(turma && turma.periodo);
        const hour = Number(String(slot.hora_inicio || '00:00').split(':')[0] || 0);
        if (period === 'matutino' || period === 'manha') return hour < 12;
        if (period === 'vespertino' || period === 'tarde') return hour >= 12 && hour < 18;
        if (period === 'noturno' || period === 'noite') return hour >= 18;
        if (period === 'integral') return hour < 18;
        return true;
    }

    function getEventTargetClasses(slot) {
        return activeRecords(KEYS.turmas, ['ativa', 'ativo']).filter(function (turma) {
            return slotMatchesClassPeriod(turma, slot);
        });
    }

    function renderWeeklyGrid(slots, assignments, turmaId, editable, protections, allowProtection) {
        const slotProtections = protections || [];
        const turma = turmaId ? findById(KEYS.turmas, turmaId) : null;
        const sorted = slots.filter(function (slot) {
            return !turmaId || slotMatchesClassPeriod(turma, slot);
        }).sort(function (a, b) {
            return String(a.hora_inicio).localeCompare(String(b.hora_inicio)) || String(a.hora_fim).localeCompare(String(b.hora_fim));
        });
        if (turmaId && !sorted.length) {
            return '<div class="empty-state py-4"><i class="bi bi-calendar-x"></i>Nenhum horário de aula cadastrado para o turno ' +
                h(turma && turma.periodo || 'da turma') + '.</div>';
        }
        const turmaAssignments = turmaId
            ? assignments.filter(function (item) { return String(item.turma_id) === String(turmaId); })
            : assignments;
        const compactSlots = turmaId && !editable && !allowProtection
            ? sorted.filter(function (slot) {
                return slotProtections.some(function (protection) {
                    return String(protection.turma_id) === String(turmaId) &&
                        String(protection.horario_id) === String(slot.id) &&
                        String(protection.dia_semana) === String(slot.dia_semana);
                }) || turmaAssignments.some(function (item) {
                    if (String(item.dia_semana || '') !== String(slot.dia_semana || '')) return false;
                    return String(item.horario_id || '') === String(slot.id) ||
                        (String(item.hora_inicio || '') === String(slot.hora_inicio || '') &&
                            String(item.hora_fim || '') === String(slot.hora_fim || ''));
                });
            })
            : sorted;
        if (!compactSlots.length) {
            return '<div class="empty-state py-4"><i class="bi bi-calendar-check"></i>Nenhuma aula alocada para esta turma.</div>';
        }
        const days = scheduleDays(compactSlots);
        const rowKeys = Array.from(new Set(compactSlots.map(function (slot) { return String(slot.hora_inicio) + '|' + String(slot.hora_fim); })));
        const header = '<thead><tr><th>Período</th>' + days.map(function (day) { return '<th>' + h(day) + '</th>'; }).join('') + '</tr></thead>';
        const body = rowKeys.map(function (range) {
            const times = range.split('|');
            const cells = days.map(function (day) {
                const slot = sorted.find(function (item) {
                    return item.dia_semana === day && String(item.hora_inicio) === times[0] && String(item.hora_fim) === times[1];
                });
                if (!slot) return '<td><span class="text-muted">—</span></td>';
                const protection = slotProtections.find(function (item) {
                    return String(item.turma_id) === String(turmaId) &&
                        String(item.horario_id) === String(slot.id) &&
                        String(item.dia_semana) === String(day);
                });
                const canDrag = Boolean(editable && turmaId && !protection);
                const dropTarget = canDrag
                    ? ' data-drop-class-id="' + h(turmaId) + '" data-drop-day="' + h(day) + '" data-drop-slot-id="' + h(slot.id) + '"'
                    : '';
                const protectionTarget = allowProtection && turmaId
                    ? ' data-protection-class-id="' + h(turmaId) + '" data-protection-day="' + h(day) +
                        '" data-protection-slot-id="' + h(slot.id) + '" title="Clique duas vezes para proteger ou alterar este horário"'
                    : '';
                const atSlot = assignments.filter(function (item) {
                    return String(item.horario_id) === String(slot.id) && String(item.dia_semana) === day &&
                        (!turmaId || String(item.turma_id) === String(turmaId));
                });
                if (!atSlot.length) {
                    const emptyContent = protection
                        ? '<div class="grade-protection-entry"><strong>' + h(protection.peculiaridade_nome || nameById(KEYS.peculiaridades, protection.peculiaridade_id, 'Protegido')) +
                            '</strong><small>' + (protection.tipo_marcacao === 'evento' ? 'Evento aplicado às turmas do mesmo turno' : 'Horário protegido') +
                            (allowProtection ? ' · duplo clique para alterar' : '') + '</small></div>'
                        : editable && turmaId
                        ? '<button class="grade-empty" type="button" data-action="select-slot" data-class-id="' + h(turmaId) + '" data-day="' + h(day) + '" data-slot-id="' + h(slot.id) + '" aria-label="Adicionar aula em ' + h(day) + ' às ' + h(slot.hora_inicio) + '"></button>'
                        : allowProtection && turmaId
                            ? '<span class="grade-protection-hint">Duplo clique para proteger</span>'
                            : '<span class="text-muted">—</span>';
                    return '<td' + dropTarget + protectionTarget + '>' + emptyContent + '</td>';
                }
                const entries = atSlot.map(function (assignment) {
                    const disciplineId = assignment.disciplina_id;
                    const disciplineName = assignment.disciplina_nome || nameById(KEYS.disciplinas, disciplineId, 'Disciplina');
                    const teacherName = assignment.professor_nome || nameById(KEYS.professores, assignment.professor_id, 'Professor');
                    const className = nameById(KEYS.turmas, assignment.turma_id, 'Turma');
                const entry = '<strong>' + h(disciplineName) + '</strong><small>' + (turmaId ? h(teacherName) : h(className + ' · ' + teacherName)) + '</small>';
                return editable
                    ? '<button class="grade-entry" type="button"' + (canDrag ? ' draggable="true" data-drag-assignment-id="' + h(assignment.id) + '"' : '') + ' data-action="edit-assignment" data-id="' + h(assignment.id) + '" style="--grade-subject-color:' + subjectColor(disciplineId) + '" title="' + (canDrag ? 'Arraste para mudar de horário ou clique para editar' : 'Editar aula') + '">' +
                    entry + '</button>'
                    : '<div class="grade-entry" style="--grade-subject-color:' + subjectColor(disciplineId) + '">' + entry + '</div>';
                }).join('');
                return '<td' + dropTarget + protectionTarget + '><div class="grade-cell-entries">' + entries + '</div></td>';
            }).join('');
            return '<tr><th>' + h(times[0]) + '–' + h(times[1]) + '</th>' + cells + '</tr>';
        }).join('');
        return '<div class="table-responsive"><table class="table table-bordered align-middle grade-table mb-0">' + header + '<tbody>' + body + '</tbody></table></div>';
    }

    function renderClassSchedules(turmas, slots, assignments, editable, teacherId, protections, allowProtection) {
        if (!turmas.length) return '<div class="empty-state"><i class="bi bi-people"></i>Cadastre turmas ativas para montar as grades.</div>';
        if (!slots.length) return '<div class="empty-state"><i class="bi bi-calendar-x"></i>Cadastre os horários de aula para montar as grades.</div>';
        const cards = turmas.map(function (turma) {
            const turmaAssignments = assignments.filter(function (item) { return String(item.turma_id) === String(turma.id); });
            const demand = getDemandsForClass(turma.id).reduce(function (sum, item) { return sum + item.aulas_semanais; }, 0);
            const pending = Math.max(0, demand - turmaAssignments.length);
            const status = teacherId ? '<span class="badge text-bg-info">Professor filtrado</span>'
                : !demand ? '<span class="badge text-bg-secondary">Sem demanda</span>'
                : pending ? '<span class="badge text-bg-warning">' + pending + ' pendente(s)</span>'
                    : turmaAssignments.length > demand ? '<span class="badge text-bg-info">Excedente</span>'
                        : '<span class="badge text-bg-success">Completa</span>';
            const classSummary = teacherId ? turmaAssignments.length + ' aula(s) do professor' : turmaAssignments.length + ' / ' + demand + ' aula(s)';
            return '<section class="card grade-class-card"><div class="card-header d-flex justify-content-between align-items-center gap-2 flex-wrap">' +
                '<strong>' + h(turma.nome) + '</strong><span class="small text-muted">' + classSummary + '</span>' + status + '</div>' +
                '<div class="card-body">' + renderWeeklyGrid(slots, turmaAssignments, turma.id, editable, protections, allowProtection) + '</div></section>';
        }).join('');
        return '<div class="grade-class-schedules">' + cards + '</div>';
    }

    function getGradeProtections(semester) {
        const selectedSemester = String(semester || getSemester());
        const eventDefinitions = new Map(readRecords(KEYS.eventos).map(function (event) {
            return [String(event.id), event];
        }));
        const protections = readRecords(KEYS.protecoesGrade).filter(function (protection) {
            return String(protection.semestre_letivo || '') === selectedSemester;
        });
        const events = readRecords(KEYS.eventosGrade).filter(function (event) {
            return String(event.semestre_letivo || '') === selectedSemester;
        }).map(function (event) {
            const definition = eventDefinitions.get(String(event.evento_id));
            return Object.assign({}, event, {
                tipo_marcacao: 'evento',
                peculiaridade_nome: definition ? definition.nome : (event.evento_nome || 'Evento')
            });
        });
        return protections.concat(events);
    }

    function renderSlotProtectionDialog() {
        const peculiarities = readRecords(KEYS.peculiaridades).slice().sort(function (a, b) {
            return String(a.nome || '').localeCompare(String(b.nome || ''), 'pt-BR');
        });
        const events = readRecords(KEYS.eventos).slice().sort(function (a, b) {
            return String(a.nome || '').localeCompare(String(b.nome || ''), 'pt-BR');
        });
        const options = '<option value="">Sem marcação · liberar horário</option>' +
            (peculiarities.length ? '<optgroup label="Peculiaridades · somente esta turma">' + peculiarities.map(function (item) {
                return '<option value="peculiaridade:' + h(item.id) + '">' + h(item.nome || 'Proteção') + ' - Peculiaridade</option>';
            }).join('') + '</optgroup>' : '') +
            (events.length ? '<optgroup label="Eventos · todas as turmas do mesmo turno">' + events.map(function (item) {
                return '<option value="evento:' + h(item.id) + '">' + h(item.nome || 'Evento') + ' - Evento</option>';
            }).join('') + '</optgroup>' : '');
        return '<dialog class="assignment-dialog" id="slot-protection-dialog" aria-labelledby="slot-protection-title">' +
            '<div class="assignment-dialog-header"><div><h2 id="slot-protection-title">Marcar horário</h2>' +
            '<p class="mb-0 text-muted" id="slot-protection-context"></p></div>' +
            '<button type="button" class="btn-close" data-action="close-slot-protection" aria-label="Fechar"></button></div>' +
            (!peculiarities.length && !events.length ? '<div class="alert alert-warning">Cadastre primeiro uma peculiaridade ou um evento nos módulos correspondentes.</div>' : '') +
            '<form id="slot-protection-form"><input type="hidden" name="turma_id"><input type="hidden" name="dia_semana"><input type="hidden" name="horario_id">' +
            '<div class="mb-3"><label class="form-label" for="slot-protection-type">Marcação</label><select class="form-select" id="slot-protection-type" name="marcacao"' +
            (peculiarities.length || events.length ? '' : ' disabled') + '>' + options + '</select>' +
            '<div class="form-text">Peculiaridades protegem somente esta turma. Eventos são aplicados em todas as turmas compatíveis com o mesmo dia, horário e turno.</div></div>' +
            '<div class="d-flex flex-wrap gap-2"><button class="btn btn-primary" type="submit"' + (peculiarities.length || events.length ? '' : ' disabled') +
            '>Salvar marcação</button><button class="btn btn-outline-secondary" type="button" data-action="close-slot-protection">Cancelar</button></div></form></dialog>';
    }

    function openSlotProtectionDialog(cell) {
        const turmaId = String(cell.dataset.protectionClassId || '');
        const day = String(cell.dataset.protectionDay || '');
        const slotId = String(cell.dataset.protectionSlotId || '');
        const semester = getSemester();
        const slot = findById(KEYS.horarios, slotId);
        const turma = findById(KEYS.turmas, turmaId);
        if (!slot || !turma || slot.dia_semana !== day) throw new Error('Não foi possível identificar a turma e o período selecionados.');
        const state = readSimulation(semester);
        const alreadyProtected = getGradeProtections(semester).find(function (item) {
            return String(item.turma_id) === turmaId &&
                String(item.dia_semana) === day &&
                String(item.horario_id) === slotId;
        });
        const occupied = state.assignments.some(function (assignment) {
            return String(assignment.turma_id) === turmaId &&
                String(assignment.dia_semana) === day &&
                String(assignment.horario_id) === slotId;
        });
        if (occupied && !alreadyProtected) {
            throw new Error('Este horário já tem uma aula. Remova ou realoque a aula antes de protegê-lo.');
        }
        const dialog = document.getElementById('slot-protection-dialog');
        const form = document.getElementById('slot-protection-form');
        if (!dialog || !form) throw new Error('O formulário de proteção não está disponível nesta tela.');
        form.elements.namedItem('turma_id').value = turmaId;
        form.elements.namedItem('dia_semana').value = day;
        form.elements.namedItem('horario_id').value = slotId;
        form.elements.namedItem('marcacao').value = alreadyProtected
            ? (alreadyProtected.tipo_marcacao === 'evento'
                ? 'evento:' + String(alreadyProtected.evento_id)
                : 'peculiaridade:' + String(alreadyProtected.peculiaridade_id))
            : '';
        document.getElementById('slot-protection-context').textContent =
            turma.nome + ' · ' + day + ' · ' + slot.hora_inicio + '–' + slot.hora_fim;
        if (!dialog.open) dialog.showModal();
    }

    function saveSlotProtection(form) {
        const data = new FormData(form);
        const semester = getSemester();
        const turmaId = String(data.get('turma_id') || '');
        const day = String(data.get('dia_semana') || '');
        const slotId = String(data.get('horario_id') || '');
        const selection = String(data.get('marcacao') || '');
        const selectionParts = /^([^:]+):(.+)$/.exec(selection);
        const selectionType = selectionParts ? selectionParts[1] : '';
        const selectionId = selectionParts ? selectionParts[2] : '';
        const slot = findById(KEYS.horarios, slotId);
        const turma = findById(KEYS.turmas, turmaId);
        if (!slot || !turma || slot.dia_semana !== day ||
            String(slot.tipo || 'Aula').toLocaleLowerCase('pt-BR') !== 'aula') {
            throw new Error('Selecione uma turma e um período de aula válidos.');
        }
        const protections = readRecords(KEYS.protecoesGrade);
        const eventPlacements = readRecords(KEYS.eventosGrade);
        const existing = getGradeProtections(semester).find(function (item) {
            return String(item.turma_id) === turmaId &&
                String(item.dia_semana) === day &&
                String(item.horario_id) === slotId;
        });
        const existingProtection = protections.find(function (item) {
            return String(item.semestre_letivo || '') === semester &&
                String(item.turma_id) === turmaId &&
                String(item.dia_semana) === day &&
                String(item.horario_id) === slotId;
        });
        const removeExistingEventGroup = function (records) {
            if (!existing || existing.tipo_marcacao !== 'evento') return records;
            return records.filter(function (item) {
                return String(item.evento_grade_id) !== String(existing.evento_grade_id);
            });
        };
        if (!selection) {
            if (!existing) throw new Error('Selecione uma marcação para salvar ou um horário marcado para liberar.');
            if (existing.tipo_marcacao === 'evento') {
                saveRecords(KEYS.eventosGrade, removeExistingEventGroup(eventPlacements), 'EventosGrade');
            } else {
                saveRecords(KEYS.protecoesGrade, protections.filter(function (item) {
                    return String(item.id) !== String(existing.id);
                }), 'ProtecoesGrade');
            }
            document.getElementById('slot-protection-dialog').close();
            render();
            notify(existing.tipo_marcacao === 'evento'
                ? 'Evento removido de todas as turmas deste horário.'
                : 'Peculiaridade removida. O horário está liberado para aulas.', 'success');
            return;
        }
        if (selectionType !== 'peculiaridade' && selectionType !== 'evento') {
            throw new Error('Selecione uma peculiaridade ou evento válido.');
        }
        const grade = readSimulation(semester);
        const occupied = grade.assignments.some(function (assignment) {
            return String(assignment.turma_id) === turmaId &&
                String(assignment.dia_semana) === day &&
                String(assignment.horario_id) === slotId;
        });
        if (selectionType === 'peculiaridade') {
            const peculiarity = findById(KEYS.peculiaridades, selectionId);
            if (!peculiarity) throw new Error('A peculiaridade selecionada não foi encontrada. Atualize a página e tente novamente.');
            if (occupied) throw new Error('Este horário já tem uma aula. Remova ou realoque a aula antes de protegê-lo.');
            const protection = {
                id: existingProtection ? existingProtection.id : nextId(protections),
                semestre_letivo: semester,
                turma_id: Number(turmaId),
                dia_semana: day,
                horario_id: Number(slotId),
                peculiaridade_id: Number(selectionId),
                peculiaridade_nome: peculiarity.nome || 'Proteção'
            };
            const nextProtections = protections.filter(function (item) {
                return String(item.id) !== String(existingProtection && existingProtection.id);
            }).concat(protection);
            saveRecords(KEYS.protecoesGrade, nextProtections, 'ProtecoesGrade');
            if (existing && existing.tipo_marcacao === 'evento') {
                saveRecords(KEYS.eventosGrade, removeExistingEventGroup(eventPlacements), 'EventosGrade');
            }
            document.getElementById('slot-protection-dialog').close();
            render();
            notify('Peculiaridade aplicada somente à turma ' + turma.nome + '.', 'success');
            return;
        }

        const eventDefinition = findById(KEYS.eventos, selectionId);
        if (!eventDefinition) throw new Error('O evento selecionado não foi encontrado. Atualize a página e tente novamente.');
        const targetClasses = getEventTargetClasses(slot);
        if (!targetClasses.some(function (item) { return String(item.id) === turmaId; })) {
            throw new Error('A turma selecionada não está entre as turmas compatíveis com este horário.');
        }
        const targetClassIds = new Set(targetClasses.map(function (item) { return String(item.id); }));
        const occupiedClasses = targetClasses.filter(function (item) {
            return grade.assignments.some(function (assignment) {
                return String(assignment.turma_id) === String(item.id) &&
                    String(assignment.dia_semana) === day &&
                    String(assignment.horario_id) === slotId;
            });
        });
        if (occupiedClasses.length) {
            const names = occupiedClasses.slice(0, 5).map(function (item) { return item.nome; }).join(', ');
            const more = occupiedClasses.length > 5 ? ' e mais ' + (occupiedClasses.length - 5) + ' turma(s)' : '';
            throw new Error('O evento não foi aplicado porque há aulas neste horário em: ' + names + more +
                '. Realoque ou remova essas aulas primeiro.');
        }
        const conflictingProtection = protections.find(function (item) {
            return String(item.semestre_letivo || '') === semester &&
                targetClassIds.has(String(item.turma_id)) &&
                String(item.dia_semana) === day &&
                String(item.horario_id) === slotId;
        });
        if (conflictingProtection) {
            const conflictingClass = targetClasses.find(function (item) { return String(item.id) === String(conflictingProtection.turma_id); });
            throw new Error('Remova primeiro a peculiaridade existente em ' + (conflictingClass ? conflictingClass.nome : 'uma turma') +
                ' antes de aplicar o evento a todas.');
        }
        const nextIdValue = nextId(eventPlacements);
        const groupId = 'evento_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
        const newPlacements = targetClasses.map(function (item, index) {
            return {
                id: nextIdValue + index,
                evento_grade_id: groupId,
                semestre_letivo: semester,
                turma_id: Number(item.id),
                dia_semana: day,
                horario_id: Number(slotId),
                evento_id: Number(selectionId),
                evento_nome: eventDefinition.nome || 'Evento'
            };
        });
        const otherPlacements = eventPlacements.filter(function (item) {
            return !(String(item.semestre_letivo || '') === semester &&
                String(item.dia_semana) === day &&
                String(item.horario_id) === slotId);
        });
        saveRecords(KEYS.eventosGrade, otherPlacements.concat(newPlacements), 'EventosGrade');
        document.getElementById('slot-protection-dialog').close();
        render();
        notify('Evento "' + eventDefinition.nome + '" aplicado em ' + targetClasses.length +
            (targetClasses.length === 1 ? ' turma.' : ' turmas.') + '.', 'success');
    }

    function renderDisciplineTeacherSchedules(slots, assignments, disciplineId, turmaId, teachers, editable) {
        const filtered = assignments.filter(function (item) {
            return String(item.disciplina_id) === String(disciplineId) &&
                (!turmaId || String(item.turma_id) === String(turmaId));
        });
        if (!filtered.length) return '<div class="empty-state"><i class="bi bi-funnel"></i>Nenhuma aula desta disciplina está na grade.</div>';
        const teacherIds = Array.from(new Set(filtered.map(function (item) { return String(item.professor_id || ''); })));
        const cards = teacherIds.map(function (teacherId) {
            const teacher = teachers.find(function (item) { return String(item.id) === teacherId; });
            const teacherAssignments = filtered.filter(function (item) { return String(item.professor_id || '') === teacherId; });
            const name = teacher ? teacher.nome : (teacherAssignments[0].professor_nome || 'Sem professor');
            return '<section class="card grade-teacher-card"><div class="card-header d-flex justify-content-between align-items-center gap-2"><strong>' + h(name) + '</strong><span class="badge text-bg-primary">' + teacherAssignments.length + ' aula(s)</span></div>' +
                '<div class="card-body">' + renderWeeklyGrid(slots, teacherAssignments, turmaId || null, editable) + '</div></section>';
        }).join('');
        return '<div class="grade-teacher-schedules">' + cards + '</div>';
    }

    function renderTeacherWorkload(professores, assignments) {
        const rows = professores.map(function (professor) {
            const teacherAssignments = assignments.filter(function (item) { return String(item.professor_id) === String(professor.id); });
            const weeklyLimit = Number(professor.carga_horaria_semanal == null ? 40 : professor.carga_horaria_semanal);
            const dailyLimit = Number(professor.limite_aulas_dia == null ? 5 : professor.limite_aulas_dia);
            const dailyCounts = DAYS.map(function (day) {
                return teacherAssignments.filter(function (item) { return item.dia_semana === day; }).length;
            });
            const dailyMax = Math.max.apply(null, dailyCounts.concat([0]));
            const percent = weeklyLimit > 0 ? Math.min(100, Math.round(teacherAssignments.length / weeklyLimit * 100)) : (teacherAssignments.length ? 100 : 0);
            const status = teacherAssignments.length > weeklyLimit
                ? '<span class="badge text-bg-danger">Acima do limite</span>'
                : teacherAssignments.length === weeklyLimit
                    ? '<span class="badge text-bg-warning">No limite</span>'
                    : '<span class="badge text-bg-success">Dentro do limite</span>';
            const dailyStatus = dailyMax > dailyLimit
                ? '<span class="text-danger fw-semibold">' + dailyMax + ' / ' + dailyLimit + ' (acima)</span>'
                : dailyMax + ' / ' + dailyLimit;
            const inactive = professor.status && !['ativo', 'ativa'].includes(String(professor.status).toLowerCase());
            return '<tr><th>' + h(professor.nome || 'Professor') + (inactive ? ' <span class="badge text-bg-secondary">Inativo</span>' : '') + '</th><td><div class="d-flex justify-content-between gap-2"><span>' + teacherAssignments.length + ' / ' + weeklyLimit + '</span>' + status + '</div>' +
                '<div class="meter mt-2"><span class="' + (teacherAssignments.length > weeklyLimit ? 'meter-over' : '') + '" style="width:' + percent + '%"></span></div></td><td>' + dailyStatus + '</td></tr>';
        }).join('');
        return '<div class="card mb-3"><div class="card-header"><strong>Carga dos professores</strong><span class="small text-muted ms-2">Aulas atribuídas / limite semanal e maior carga em um dia / limite diário</span></div>' +
            '<div class="table-responsive"><table class="table table-hover align-middle mb-0"><thead><tr><th>Professor</th><th>Carga semanal</th><th>Máximo diário</th></tr></thead><tbody>' +
            (rows || '<tr><td colspan="3" class="text-center text-muted py-4">Cadastre professores para acompanhar a carga.</td></tr>') +
            '</tbody></table></div></div>';
    }

    function renderVinculoCoverage() {
        const courses = activeRecords(KEYS.cursos, ['ativo', 'ativa']);
        if (!courses.some(function (course) { return String(course.id) === String(coverageCourseId); })) coverageCourseId = '';
        const courseOptions = courses.map(function (course) {
            return '<option value="' + h(course.id) + '"' + (String(course.id) === String(coverageCourseId) ? ' selected' : '') + '>' + h(course.nome) + '</option>';
        }).join('');
        const courseSelector = '<div class="mb-3"><label class="form-label" for="coverage-course">Curso</label><select class="form-select" id="coverage-course"><option value="">Selecione um curso</option>' +
            courseOptions + '</select></div>';
        if (!courses.length) {
            return '<div class="card mb-4"><div class="card-header"><strong>Cobertura dos vínculos</strong></div><div class="card-body">' +
                courseSelector + '<p class="text-muted mb-0">Cadastre um curso e associe turmas a ele para acompanhar os vínculos por curso.</p></div></div>';
        }
        if (!coverageCourseId) {
            return '<div class="card mb-4"><div class="card-header"><strong>Cobertura dos vínculos</strong></div><div class="card-body">' +
                courseSelector + '<p class="text-muted mb-0">Selecione um curso para ver as disciplinas demandadas e a cobertura dos professores no semestre ' + h(getSemester()) + '.</p></div></div>';
        }

        const course = findById(KEYS.cursos, coverageCourseId);
        const classes = activeRecords(KEYS.turmas, ['ativa', 'ativo']).filter(function (turma) {
            return String(turma.curso_id || '') === String(coverageCourseId) ||
                (!turma.curso_id && normalizeCatalogValue(turma.curso_nome) === normalizeCatalogValue(course && course.nome));
        });
        const demandedById = new Map();
        classes.forEach(function (turma) {
            getDemandsForClass(turma.id).forEach(function (demand) {
                if (demand.aulas_semanais > 0) demandedById.set(String(demand.disciplina_id), demand);
            });
        });
        const demandedIds = new Set(demandedById.keys());
        const links = readRecords(KEYS.vinculos).filter(semesterMatches);
        const teachers = activeRecords(KEYS.professores, ['ativo']);
        const activeTeacherIds = new Set(teachers.map(function (teacher) { return String(teacher.id); }));
        const courseLinks = links.filter(function (row) {
            return demandedIds.has(String(row.disciplina_id)) && activeTeacherIds.has(String(row.professor_id));
        });
        const linkedTeacherIds = new Set(courseLinks.map(function (row) { return String(row.professor_id); }));
        const linkedDisciplineIds = new Set(courseLinks.map(function (row) { return String(row.disciplina_id); }));
        const disciplines = Array.from(demandedById.values()).map(function (demand) {
            return findById(KEYS.disciplinas, demand.disciplina_id) || {
                id: demand.disciplina_id,
                nome: demand.disciplina_nome
            };
        });
        const teachersWithoutDiscipline = teachers.filter(function (teacher) {
            return !linkedTeacherIds.has(String(teacher.id));
        });
        const disciplinesWithoutTeacher = disciplines.filter(function (discipline) {
            return !linkedDisciplineIds.has(String(discipline.id));
        });
        const missingTeachers = teachersWithoutDiscipline.length
            ? '<ul class="mb-0">' + teachersWithoutDiscipline.map(function (teacher) {
                return '<li>' + h(teacher.nome || 'Professor') + '</li>';
            }).join('') + '</ul>'
            : '<p class="text-success mb-0">Todos os professores ativos estão vinculados a uma disciplina demandada deste curso.</p>';
        const missingDisciplines = disciplinesWithoutTeacher.length
            ? '<ul class="mb-0">' + disciplinesWithoutTeacher.map(function (discipline) {
                return '<li>' + h(discipline.nome || 'Disciplina') + '</li>';
            }).join('') + '</ul>'
            : '<p class="text-success mb-0">Todas as disciplinas demandadas têm ao menos um professor vinculado.</p>';
        const emptyDemand = !demandedIds.size
            ? '<div class="alert alert-warning">Não há demandas de disciplinas para as turmas deste curso no semestre selecionado. Confira as demandas e o semestre.</div>'
            : '';
        return '<div class="card mb-4"><div class="card-header d-flex justify-content-between align-items-center gap-2 flex-wrap"><strong>Cobertura dos vínculos</strong><span class="badge text-bg-primary">Semestre ' + h(getSemester()) + '</span></div>' +
            '<div class="card-body">' + courseSelector + '<p class="small text-muted">Curso: ' + h(course ? course.nome : '') + ' · ' + classes.length + ' turma(s) ativa(s) · ' + demandedIds.size + ' disciplina(s) demandada(s)</p>' + emptyDemand +
            '<div class="row g-4"><div class="col-md-6"><h2 class="h6">Professores sem vínculo com as disciplinas do curso (' + (demandedIds.size ? teachersWithoutDiscipline.length : '—') + ')</h2>' + (demandedIds.size ? missingTeachers : '') + '</div>' +
            '<div class="col-md-6"><h2 class="h6">Disciplinas demandadas sem professor (' + disciplinesWithoutTeacher.length + ')</h2>' + missingDisciplines + '</div></div></div></div>';
    }

    function getQdpConfig() {
        const periods = readRecords(KEYS.horarios).filter(function (item) { return String(item.tipo || 'Aula').toLowerCase() === 'aula'; });
        const sortedTimes = Array.from(new Set(periods.map(function (item) { return String(item.hora_inicio); }))).sort();
        const horarios = periods.map(function (item) {
            return Object.assign({}, item, { id: Number(item.id), ordem_aula: sortedTimes.indexOf(String(item.hora_inicio)) + 1 });
        });
        const professores = activeRecords(KEYS.professores, ['ativo']).map(function (item) {
            return {
                id: Number(item.id), nome: String(item.nome || ''),
                carga_horaria_semanal: Number(item.carga_horaria_semanal || 40),
                limite_aulas_dia: Number(item.limite_aulas_dia || 5), carga_atual: 0
            };
        });
        const turmas = activeRecords(KEYS.turmas, ['ativa', 'ativo']).map(function (item) {
            return {
                id: Number(item.id), nome: String(item.nome || ''),
                periodo: String(item.periodo || ''), curso_nome: String(item.curso_nome || nameById(KEYS.cursos, item.curso_id, '')),
                ano_letivo: Number(item.ano_letivo || 0)
            };
        });
        const disciplinas = readRecords(KEYS.disciplinas).map(function (item) {
            return { id: Number(item.id), nome: String(item.nome || ''), carga_horaria: Number(item.carga_horaria || 0), restricoes: item.restricoes || {} };
        });
        const vínculosRaw = readRecords(KEYS.vinculos).filter(semesterMatches);
        const vínculos = {};
        vínculosRaw.forEach(function (row) {
            const professor = professores.find(function (item) { return item.id === Number(row.professor_id); });
            const disciplineId = String(Number(row.disciplina_id));
            if (!professor) return;
            if (!vínculos[disciplineId]) vínculos[disciplineId] = [];
            vínculos[disciplineId].push({
                id: professor.id, nome: professor.nome,
                carga_horaria_semanal: professor.carga_horaria_semanal,
                limite_aulas_dia: professor.limite_aulas_dia
            });
        });
        const demandaPorTurma = {};
        turmas.forEach(function (turma) {
            demandaPorTurma[turma.id] = getDemandsForClass(turma.id).map(function (row) {
                return {
                    disciplina_id: Number(row.disciplina_id),
                    disciplina_nome: row.disciplina_nome,
                    aulas_previstas: Number(row.aulas_semanais)
                };
            });
        });
        const availabilityRecords = readRecords(KEYS.disponibilidade).filter(semesterMatches);
        const disponibilidades = {};
        availabilityRecords.forEach(function (row) {
            const professorId = Number(row.professor_id);
            if (!professorId || !professores.some(function (item) { return item.id === professorId; })) return;
            if (!disponibilidades[professorId]) disponibilidades[professorId] = { dias_semana: [], restricoes: [] };
            const isPrd = String(row.tipo || '').toLowerCase() === 'prd';
            const available = !isPrd && (row.disponivel === true || Number(row.disponivel) === 1 || String(row.disponivel).toLowerCase() === 'sim');
            const slotId = Number(row.horario_id || 0);
            if (available && !slotId && !disponibilidades[professorId].dias_semana.includes(row.dia_semana)) {
                disponibilidades[professorId].dias_semana.push(row.dia_semana);
            } else if (!available && slotId) {
                disponibilidades[professorId].restricoes.push({ dia_semana: row.dia_semana, horario_id: slotId, tipo: 'indisponivel' });
            } else if (!available && !slotId) {
                horarios.filter(function (slot) { return slot.dia_semana === row.dia_semana; }).forEach(function (slot) {
                    disponibilidades[professorId].restricoes.push({ dia_semana: row.dia_semana, horario_id: Number(slot.id), tipo: 'indisponivel' });
                });
            }
        });
        return {
            dias: DAYS,
            horarios: horarios,
            turmas: turmas,
            professores: professores,
            disciplinas: disciplinas,
            vinculos: vínculos,
            demandaPorTurma: demandaPorTurma,
            disponibilidades: disponibilidades,
            protecoes: getGradeProtections(getSemester()),
            maxAulasDia: Math.max(1, Math.max.apply(null, DAYS.map(function (day) {
                return horarios.filter(function (slot) { return slot.dia_semana === day; }).length;
            })))
        };
    }

    function showGenerationSummary(report) {
        window.clearTimeout(generationSummaryTimer);
        const previous = document.getElementById('generation-summary');
        if (previous) previous.remove();
        const pending = Array.isArray(report.falhas) ? report.falhas : [];
        const locations = pending.slice(0, 5).map(function (item) {
            return '<li><strong>' + h(item.turma_nome || 'Turma') + '</strong> · ' +
                h(item.disciplina_nome || 'Disciplina') + ': faltaram ' + h(item.pendentes || 0) + '</li>';
        }).join('');
        const extra = pending.length > 5
            ? '<li class="text-muted">e mais ' + (pending.length - 5) + ' pendência(s)</li>'
            : '';
        const complete = Number(report.totalPendentes || 0) === 0;
        const summary = document.createElement('section');
        summary.id = 'generation-summary';
        summary.className = 'generation-summary' + (complete ? ' is-complete' : ' has-pending');
        summary.setAttribute('role', 'status');
        summary.setAttribute('aria-live', 'polite');
        summary.innerHTML = '<div class="d-flex align-items-start gap-2"><i class="bi ' +
            (complete ? 'bi-check-circle-fill' : 'bi-exclamation-circle-fill') +
            ' generation-summary-icon" aria-hidden="true"></i><div class="flex-grow-1"><strong>' +
            (complete ? 'Geração completa' : 'Resumo da geração') + '</strong><div class="generation-summary-metrics">' +
            '<span><b>' + h(report.totalPrevistas || 0) + '</b> previstas</span><span><b>' +
            h(report.totalAtendidas || 0) + '</b> preenchidas</span><span><b>' +
            h(report.totalPendentes || 0) + '</b> faltantes</span></div>' +
            (locations ? '<div class="generation-summary-label">Pendências por turma e disciplina</div><ul>' + locations + extra + '</ul>' :
                '<div class="generation-summary-label">Todas as aulas previstas foram alocadas.</div>') +
            '</div></div>';
        document.body.appendChild(summary);
        generationSummaryTimer = window.setTimeout(function () {
            summary.classList.add('is-leaving');
            generationSummaryTimer = window.setTimeout(function () { summary.remove(); }, 300);
        }, 6700);
    }

    function showQdpProcessing() {
        const previous = document.getElementById('qdp-processing');
        if (previous) previous.remove();
        const overlay = document.createElement('div');
        overlay.id = 'qdp-processing';
        overlay.className = 'qdp-processing';
        overlay.setAttribute('role', 'status');
        overlay.setAttribute('aria-live', 'polite');
        overlay.setAttribute('aria-label', 'Gerando grade escolar');
        overlay.innerHTML = '<div class="qdp-processing-card"><div class="qdp-loader" aria-hidden="true">' +
            '<span class="qdp-loader-orbit"></span><i class="bi bi-calendar2-week-fill"></i></div>' +
            '<h2>Gerando grade com o QDP</h2><p>Estamos organizando as aulas e conferindo as disponibilidades.</p>' +
            '<strong class="qdp-processing-elapsed">Tempo decorrido: 0 s</strong>' +
            '<small>Esse processo pode levar alguns instantes para muitas turmas ou aulas. Aguarde.</small></div>';
        document.body.appendChild(overlay);
        const button = document.querySelector('[data-action="generate-grade"]');
        if (button) {
            button.disabled = true;
            button.setAttribute('aria-busy', 'true');
        }
        view.setAttribute('aria-busy', 'true');
        const startedAt = Date.now();
        qdpProcessingTimer = window.setInterval(function () {
            const elapsed = document.querySelector('.qdp-processing-elapsed');
            if (elapsed) elapsed.textContent = 'Tempo decorrido: ' + Math.floor((Date.now() - startedAt) / 1000) + ' s';
        }, 1000);
    }

    function hideQdpProcessing() {
        window.clearInterval(qdpProcessingTimer);
        qdpProcessingTimer = 0;
        const overlay = document.getElementById('qdp-processing');
        if (overlay) overlay.remove();
        const button = document.querySelector('[data-action="generate-grade"]');
        if (button) {
            button.disabled = false;
            button.removeAttribute('aria-busy');
        }
        view.removeAttribute('aria-busy');
    }

    function runQdpInWorker(config) {
        let worker;
        try {
            worker = new Worker('assets/js/qdp-worker.js');
        } catch (error) {
            console.warn('Web Worker indisponível; executando o QDP na página:', error);
            return Promise.resolve().then(function () {
                return new QDPEngine(config).gerarGradeCompleta();
            });
        }
        return new Promise(function (resolve, reject) {
            worker.onmessage = function (event) {
                worker.terminate();
                if (event.data && event.data.error) {
                    const error = new Error(event.data.error);
                    if (event.data.stack) error.stack = event.data.stack;
                    reject(error);
                    return;
                }
                resolve(event.data && event.data.result);
            };
            worker.onerror = function (event) {
                worker.terminate();
                reject(new Error(event.message || 'O processo QDP em segundo plano falhou.'));
            };
            try {
                worker.postMessage(config);
            } catch (error) {
                worker.terminate();
                reject(error);
            }
        });
    }

    async function generateGrade() {
        if (qdpGenerationInProgress) return;
        if (typeof QDPEngine !== 'function') throw new Error('O mecanismo QDP não foi carregado. Atualize a página e tente novamente.');
        const semester = getSemester();
        const state = readSimulation(semester);
        const config = getQdpConfig();
        const demandCount = Object.values(config.demandaPorTurma).reduce(function (sum, rows) {
            return sum + rows.reduce(function (part, row) { return part + row.aulas_previstas; }, 0);
        }, 0);
        if (!config.turmas.length || !config.professores.length || !config.horarios.length || !demandCount) {
            throw new Error('Antes de gerar, cadastre turmas, professores, horários e demandas semanais.');
        }
        if (!Object.keys(config.vinculos).length) throw new Error('Vincule professores às disciplinas antes de gerar a grade.');
        qdpGenerationInProgress = true;
        try {
            showQdpProcessing();
            await new Promise(function (resolve) { window.requestAnimationFrame(resolve); });
            const result = await runQdpInWorker(config);
            if (!result || !Array.isArray(result.assignments)) throw new Error('O QDP não retornou uma grade válida.');
            const report = result.relatorio || {};
            state.assignments = result.assignments.map(function (assignment, index) {
                return Object.assign({}, assignment, { id: assignment.id || index + 1 });
            });
            state.activeTurmaId = state.activeTurmaId || (config.turmas[0] && config.turmas[0].id);
            state.lastGenerationReport = {
                geradoEm: new Date().toISOString(),
                totalPrevistas: Number(report.totalPrevistas || 0),
                totalAtendidas: Number(report.totalAtendidas || 0),
                totalPendentes: Number(report.totalPendentes || 0),
                percentual: Number(report.totalPrevistas ? (report.totalAtendidas / report.totalPrevistas * 100).toFixed(2) : 0),
                completo: Boolean(result.completo),
                turmas: report.turmas || [],
                professores: report.professores || [],
                falhas: report.falhas || [],
                logs: result.logs || []
            };
            state.qdpInfo = { geradoEm: new Date().toISOString(), tempo: result.tempo, completo: Boolean(result.completo) };
            state.metodo = 'QDP';
            saveSimulation(semester, state);
        } catch (error) {
            console.error('Falha ao gerar grade com QDP:', error);
            notify(error.message || 'Não foi possível gerar a grade.', 'danger');
            return;
        } finally {
            hideQdpProcessing();
            qdpGenerationInProgress = false;
        }
        render();
        showGenerationSummary(state.lastGenerationReport);
    }

    function renderGrade(manualAdjustments) {
        const semester = getSemester();
        const state = readSimulation(semester);
        const editable = Boolean(manualAdjustments);
        const turmas = activeRecords(KEYS.turmas, ['ativa', 'ativo']);
        const slots = readRecords(KEYS.horarios).filter(function (slot) { return String(slot.tipo || 'Aula').toLowerCase() === 'aula'; });
        const assignments = state.assignments || [];
        const protections = getGradeProtections(semester);
        const disciplines = readRecords(KEYS.disciplinas);
        const teachers = activeRecords(KEYS.professores, ['ativo']);
        if (!['', 'complete', 'pending'].includes(gradeCompletionFilter)) gradeCompletionFilter = '';
        const effectiveCompletionFilter = gradeCompletionFilter;
        if (gradeTurmaFilter && !turmas.some(function (turma) { return String(turma.id) === String(gradeTurmaFilter); })) gradeTurmaFilter = '';
        if (gradeDisciplineFilter && !disciplines.some(function (discipline) { return String(discipline.id) === String(gradeDisciplineFilter); })) gradeDisciplineFilter = '';
        if (gradeTeacherFilter && !teachers.some(function (teacher) { return String(teacher.id) === String(gradeTeacherFilter); })) gradeTeacherFilter = '';
        const selectedTurma = turmas.find(function (turma) { return String(turma.id) === String(gradeTurmaFilter); }) ||
            turmas.find(function (turma) { return String(turma.id) === String(state.activeTurmaId); }) || turmas[0];
        const semesterForm = '<form id="semester-form" class="d-flex align-items-end gap-2"><div><label class="form-label mb-1" for="semester-input">Semestre</label>' +
            '<input id="semester-input" class="form-control form-control-sm" value="' + h(semester) + '" pattern="\\d{4}/[12]" placeholder="AAAA/1" required></div>' +
            '<button class="btn btn-sm btn-outline-primary" type="submit">Aplicar</button></form>';
        const pdfRecords = pdfExportType === 'turma'
            ? activeRecords(KEYS.turmas, ['ativa', 'ativo'])
            : activeRecords(KEYS.professores, ['ativo']);
        if (pdfExportId && pdfExportId !== 'todas' && !pdfRecords.some(function (item) { return String(item.id) === String(pdfExportId); })) pdfExportId = '';
        if (!pdfExportId && pdfRecords.length) pdfExportId = String(pdfRecords[0].id);
        const pdfExportControls = !editable
            ? '<div class="d-flex flex-wrap align-items-end gap-2 no-print"><div><label class="form-label mb-1" for="pdf-export-type">Exportar por</label><select class="form-select form-select-sm" id="pdf-export-type"><option value="turma"' + (pdfExportType === 'turma' ? ' selected' : '') + '>Turma</option><option value="professor"' + (pdfExportType === 'professor' ? ' selected' : '') + '>Professor</option></select></div>' +
                '<div><label class="form-label mb-1" for="pdf-export-entity">' + (pdfExportType === 'turma' ? 'Turma' : 'Professor') + '</label><select class="form-select form-select-sm" id="pdf-export-entity">' +
                (pdfExportType === 'turma' ? '<option value="todas"' + (pdfExportId === 'todas' ? ' selected' : '') + '>Todas as turmas</option>' : '') +
                (pdfRecords.length ? pdfRecords.map(function (item) {
                    return '<option value="' + h(item.id) + '"' + (String(item.id) === pdfExportId ? ' selected' : '') + '>' + h(item.nome) + '</option>';
                }).join('') : '<option value="">Nenhum registro cadastrado</option>') + '</select></div>' +
                '<button class="btn btn-sm btn-outline-primary" type="button" data-action="print-schedule-pdf"' + (pdfRecords.length ? '' : ' disabled') + '><i class="bi bi-file-earmark-pdf me-1"></i>Gerar PDF</button>' +
                '<button class="btn btn-sm btn-outline-primary" type="button" data-action="export-individual-schedule-csv"' +
                    (pdfRecords.length && pdfExportId !== 'todas' ? '' : ' disabled') + '><i class="bi bi-filetype-csv me-1"></i>Baixar CSV individual</button>' +
                '<button class="btn btn-sm btn-outline-primary" type="button" data-action="download-individual-schedule-pdf"' +
                    (pdfRecords.length && pdfExportId !== 'todas' ? '' : ' disabled') + '><i class="bi bi-file-earmark-pdf me-1"></i>Baixar PDF individual</button>' +
                '<button class="btn btn-sm btn-outline-primary" type="button" data-action="share-individual-schedule-pdf"' +
                    (pdfRecords.length && pdfExportId !== 'todas' ? '' : ' disabled') + '><i class="bi bi-share me-1"></i>Compartilhar PDF</button>' +
                (pdfExportType === 'turma' && pdfExportId === 'todas'
                    ? '<button class="btn btn-sm btn-outline-primary" type="button" data-action="share-complete-schedule-pdf"' +
                        (pdfRecords.length ? '' : ' disabled') + '><i class="bi bi-collection me-1"></i>Compartilhar grade completa</button>'
                    : '') +
                '<button class="btn btn-sm btn-outline-secondary" type="button" data-action="share-individual-schedule"' +
                    (pdfRecords.length && pdfExportId !== 'todas' ? '' : ' disabled') + '><i class="bi bi-share me-1"></i>Compartilhar resumo</button></div>' +
                '<p class="form-text no-print mb-0">PDFs individuais ou a grade de todas as turmas podem ser enviados como arquivo pelo menu de compartilhamento do dispositivo. O Owltime mantém os dados localmente; publicação por link requer um serviço externo.</p>'
            : '';
        const turmaFilter = '<div class="grade-filter"><label class="form-label mb-1" for="grade-turma-filter">Filtrar turma</label><select class="form-select" id="grade-turma-filter">' +
            '<option value="">Todas as turmas</option>' +
            turmas.map(function (turma) {
                return '<option value="' + h(turma.id) + '"' + (String(gradeTurmaFilter) === String(turma.id) ? ' selected' : '') + '>' + h(turma.nome) + '</option>';
            }).join('') + '</select></div>';
        const disciplineFilter = '<div class="grade-filter"><label class="form-label mb-1" for="grade-discipline-filter">Filtrar disciplina</label><select class="form-select" id="grade-discipline-filter">' +
            '<option value="">Todas as disciplinas · visão por turma</option>' +
            disciplines.map(function (discipline) {
                return '<option value="' + h(discipline.id) + '"' + (String(gradeDisciplineFilter) === String(discipline.id) ? ' selected' : '') + '>' + h(discipline.nome) + '</option>';
            }).join('') + '</select></div>';
        const teacherFilter = '<div class="grade-filter"><label class="form-label mb-1" for="grade-teacher-filter">Filtrar professor</label><select class="form-select" id="grade-teacher-filter">' +
            '<option value="">Todos os professores</option>' +
            teachers.map(function (teacher) {
                return '<option value="' + h(teacher.id) + '"' + (String(gradeTeacherFilter) === String(teacher.id) ? ' selected' : '') + '>' + h(teacher.nome) + '</option>';
            }).join('') + '</select></div>';
        const completionFilter = '<div class="grade-filter"><label class="form-label mb-1" for="grade-completion-filter">Situação da grade</label><select class="form-select" id="grade-completion-filter">' +
                '<option value=""' + (!effectiveCompletionFilter ? ' selected' : '') + '>Todas as grades</option>' +
                '<option value="complete"' + (effectiveCompletionFilter === 'complete' ? ' selected' : '') + '>Grades completas</option>' +
                '<option value="pending"' + (effectiveCompletionFilter === 'pending' ? ' selected' : '') + '>Com pendências</option>' +
                '</select></div>';
        const legend = '<div class="grade-discipline-legend">' + disciplines.map(function (discipline) {
            return '<span class="grade-discipline-chip"><i style="--grade-subject-color:' + subjectColor(discipline.id) + '"></i>' + h(discipline.nome) + '</span>';
        }).join('') + '</div>';
        const selectedFilterTurma = turmas.find(function (turma) { return String(turma.id) === String(gradeTurmaFilter); });
        const completionClassIds = new Set(turmas.filter(function (turma) {
            const demandedLessons = getDemandsForClass(turma.id, semester).reduce(function (total, demand) {
                return total + demand.aulas_semanais;
            }, 0);
            const allocatedLessons = assignments.filter(function (assignment) {
                return String(assignment.turma_id) === String(turma.id);
            }).length;
            return demandedLessons > 0 && (effectiveCompletionFilter === 'complete'
                ? allocatedLessons >= demandedLessons
                : allocatedLessons < demandedLessons);
        }).map(function (turma) { return String(turma.id); }));
        const filteredAssignments = assignments.filter(function (assignment) {
            return (!gradeTurmaFilter || String(assignment.turma_id) === String(gradeTurmaFilter)) &&
                (!effectiveCompletionFilter || completionClassIds.has(String(assignment.turma_id))) &&
                (!gradeDisciplineFilter || String(assignment.disciplina_id) === String(gradeDisciplineFilter)) &&
                (!gradeTeacherFilter || String(assignment.professor_id) === String(gradeTeacherFilter));
        });
        const visibleTurmas = turmas.filter(function (turma) {
            return (!gradeTurmaFilter || String(turma.id) === String(gradeTurmaFilter)) &&
                (!effectiveCompletionFilter || completionClassIds.has(String(turma.id))) &&
                (!gradeTeacherFilter || filteredAssignments.some(function (assignment) {
                    return String(assignment.turma_id) === String(turma.id);
                }));
        });
        const scheduleView = gradeDisciplineFilter
            ? '<div class="card mb-3"><div class="card-header d-flex justify-content-between align-items-center gap-2 flex-wrap"><strong>Disciplina por professor</strong>' +
                '<span class="text-muted small">' + h(nameById(KEYS.disciplinas, gradeDisciplineFilter, 'Disciplina')) +
                (selectedFilterTurma ? ' · ' + h(selectedFilterTurma.nome) : ' · todas as turmas') +
                (gradeTeacherFilter ? ' · ' + h(nameById(KEYS.professores, gradeTeacherFilter, 'Professor')) : '') +
                (editable ? ' · clique em uma aula para editar' : '') + '</span></div><div class="card-body">' +
                renderDisciplineTeacherSchedules(slots, filteredAssignments, gradeDisciplineFilter, gradeTurmaFilter, teachers, editable) + '</div></div>'
            : !selectedFilterTurma
                ? '<section class="card mb-3"><div class="card-header d-flex justify-content-between align-items-center gap-2 flex-wrap">' +
                    '<div><strong>Grade de todas as turmas</strong><span class="text-muted small ms-2">' +
                    (editable ? 'Arraste aulas para horários vazios, clique em uma aula para editar ou em um horário vazio para adicionar.' : 'Duplo clique em um período para aplicar ou alterar uma peculiaridade ou evento.') +
                    '</span></div><button class="btn btn-sm btn-outline-secondary" type="button" data-action="toggle-grade-all-classes" aria-controls="grade-all-classes-content" aria-expanded="' +
                    String(!gradeAllClassesCollapsed) + '"><i class="bi ' + (gradeAllClassesCollapsed ? 'bi-chevron-down' : 'bi-chevron-up') +
                    ' me-1" aria-hidden="true"></i>' + (gradeAllClassesCollapsed ? 'Expandir grade' : 'Recolher grade') +
                    '</button></div><div id="grade-all-classes-content" class="card-body p-2"' + (gradeAllClassesCollapsed ? ' hidden' : '') + '>' +
                    ((gradeTeacherFilter || effectiveCompletionFilter) && !visibleTurmas.length
                        ? '<div class="empty-state"><i class="bi bi-funnel"></i>Nenhuma aula corresponde aos filtros selecionados.</div>'
                        : renderClassSchedules(visibleTurmas, slots, filteredAssignments, editable, gradeTeacherFilter, protections, !editable)) +
                    '</div></section>'
                : '<div class="mb-2"><strong>Grade da turma ' + h(selectedFilterTurma.nome) +
                    '</strong><span class="text-muted small ms-2">' +
                    (editable ? 'Arraste aulas para horários vazios, clique em uma aula para editar ou em um horário vazio para adicionar.' : 'Duplo clique em um período para aplicar ou alterar uma peculiaridade ou evento.') +
                    '</span></div>' +
                ((gradeTeacherFilter || effectiveCompletionFilter) && !visibleTurmas.length
                    ? '<div class="empty-state"><i class="bi bi-funnel"></i>Nenhuma aula corresponde aos filtros selecionados.</div>'
                    : renderClassSchedules(visibleTurmas, slots, filteredAssignments, editable, gradeTeacherFilter, protections, !editable));
        const gradeEditing = state.assignments.find(function (item) { return String(item.id) === String(gradeEditingId); }) || null;
        const manual = editable ? renderManualAssignment(selectedTurma, slots, gradeEditing, gradeFocusDay, gradeFocusSlotId) : '';
        const workload = renderTeacherWorkload(readRecords(KEYS.professores), assignments);
        const declarationControls = editable ? '' : renderDeclarationControls(semester, assignments);
        const substitutionPanel = renderTeacherSubstitutionPanel(semester, assignments, turmas);
        const title = editable ? 'Ajustes manuais' : 'Grade oficial';
        const description = editable
            ? 'Arraste uma aula para outro horário vazio ou clique nela para editar. Com filtro por disciplina, selecione também uma turma para arrastar.'
            : 'Gere a grade automaticamente pelo QDP e acompanhe todas as turmas, demandas e cargas docentes.';
        const navigation = editable
            ? '<a class="btn btn-outline-secondary" href="#/grade"><i class="bi bi-arrow-left me-1"></i>Voltar à Grade oficial</a>'
            : '<a class="btn btn-outline-primary" href="#/ajustes"><i class="bi bi-pencil-square me-1"></i>Ajustes manuais</a>';
        const generationButton = editable ? '' :
            '<button class="btn btn-primary" type="button" data-action="generate-grade"><i class="bi bi-magic me-1"></i>Gerar grade automaticamente (QDP)</button>';
        return pageHeader(title, 'bi-calendar3', description) +
            '<div class="card mb-3"><div class="card-body d-flex flex-wrap justify-content-between align-items-end gap-3">' +
            semesterForm + '<div class="d-flex flex-wrap align-items-end gap-2">' + pdfExportControls + generationButton + navigation + '<button class="btn btn-outline-primary" type="button" data-action="export-grade">Exportar JSON</button>' +
            '<button class="btn btn-outline-secondary" type="button" data-action="print">Imprimir</button>' +
            '<button class="btn btn-outline-danger" type="button" data-action="clear-grade">Limpar grade</button></div></div></div>' +
            '<div class="card mb-3"><div class="card-body d-flex align-items-end justify-content-between flex-wrap gap-3">' + turmaFilter + disciplineFilter + teacherFilter + completionFilter + legend + '</div></div>' +
            scheduleView + (!editable ? renderSlotProtectionDialog() : '') + declarationControls + substitutionPanel + workload + manual +
            '<p class="small text-muted mt-3"><i class="bi bi-info-circle me-1"></i>' + (editable
                ? 'As alterações manuais são gravadas neste navegador. Confira as orientações de demanda e disponibilidade no formulário de cada aula.'
                : 'Use os ajustes manuais em uma tela separada para corrigir ou complementar a grade automática.') + '</p>';
    }

    function renderDeclarationControls(semester, assignments) {
        const institutionName = localStorage.getItem(DECLARATION_INSTITUTION_KEY) || '';
        return '<section class="card mb-3 no-print"><div class="card-header"><strong>Declaração de carga horária docente</strong></div><div class="card-body">' +
            '<div class="row g-3 align-items-end"><div class="col-md-8"><label class="form-label" for="declaration-institution">Nome da instituição</label>' +
            '<input class="form-control" id="declaration-institution" type="text" maxlength="160" value="' + h(institutionName) + '" placeholder="Informe o nome da instituição" required></div>' +
            '<div class="col-md-4"><button class="btn btn-primary w-100" type="button" data-action="generate-teacher-declaration"' +
            (assignments.length ? '' : ' disabled') + '><i class="bi bi-file-earmark-pdf me-1"></i>Gerar Declaração</button></div></div>' +
            '<p class="form-text mb-0 mt-2">O PDF considera a grade completa, independente dos filtros de visualização, compara as aulas semanais com a carga declarada de cada professor e aplica as substituições vigentes em ' +
            h(semester) + ' na data de emissão.</p></div></section>';
    }

    function renderTeacherSubstitutionPanel(semester, assignments, turmas) {
        const substitutions = readRecords(KEYS.substituicoes).filter(function (record) {
            return String(record.semestre_letivo || '') === semester;
        }).sort(function (a, b) {
            return String(a.data_inicio || '').localeCompare(String(b.data_inicio || '')) ||
                String(a.id).localeCompare(String(b.id), 'pt-BR', { numeric: true });
        });
        const editingSubstitution = substitutions.find(function (record) {
            return String(record.id) === teacherSubstitutionEditingId;
        }) || null;
        const selectedClassId = editingSubstitution ? String(editingSubstitution.turma_id) : '';
        const selectedDisciplineId = editingSubstitution ? String(editingSubstitution.disciplina_id) : '';
        const substitutionOptions = getTeacherSubstitutionOptions(
            selectedClassId, selectedDisciplineId,
            editingSubstitution ? editingSubstitution.data_inicio : declarationDateValue(new Date()),
            assignments, semester, substitutions, editingSubstitution
        );
        const classOptions = '<option value="">Selecione a turma</option>' + turmas.map(function (turma) {
            return '<option value="' + h(turma.id) + '"' +
                (String(turma.id) === selectedClassId ? ' selected' : '') + '>' + h(turma.nome || 'Turma') + '</option>';
        }).join('');
        const disciplineOptions = renderSubstitutionSelectOptions(
            substitutionOptions.disciplines, 'Selecione a disciplina', selectedDisciplineId
        );
        const originalTeacherOptions = renderSubstitutionSelectOptions(
            substitutionOptions.originalTeachers, 'Selecione o professor substituído',
            editingSubstitution ? editingSubstitution.professor_original_id : ''
        );
        const replacementTeacherOptions = renderSubstitutionSelectOptions(
            substitutionOptions.allTeachers, 'Selecione o professor substituto',
            editingSubstitution ? editingSubstitution.professor_substituto_id : ''
        );
        const rows = substitutions.map(function (record) {
            const matchingAssignments = getSubstitutionAffectedAssignments(assignments, semester, substitutions, record).length;
            return '<tr><td>' + h(nameById(KEYS.turmas, record.turma_id, record.turma_nome || 'Turma removida')) + '</td><td>' +
                h(nameById(KEYS.disciplinas, record.disciplina_id, record.disciplina_nome || 'Disciplina removida')) + '</td><td>' +
                h(nameById(KEYS.professores, record.professor_original_id, record.professor_original_nome || 'Professor removido')) + ' → ' +
                h(nameById(KEYS.professores, record.professor_substituto_id, record.professor_substituto_nome || 'Professor removido')) + '</td><td>' +
                h(formatSubstitutionDate(record.data_inicio)) + ' – ' +
                h(record.data_fim ? formatSubstitutionDate(record.data_fim) : 'sem data final') + '</td><td>' +
                (matchingAssignments ? matchingAssignments + ' aula(s)/semana' : '<span class="text-warning">Sem correspondência na grade atual</span>') +
                '</td><td class="text-end"><div class="table-actions"><button class="btn btn-sm btn-outline-primary" type="button" data-action="edit-teacher-substitution" data-id="' +
                h(record.id) + '" aria-label="Editar substituição"><i class="bi bi-pencil"></i></button><button class="btn btn-sm btn-outline-danger" type="button" data-action="delete-teacher-substitution" data-id="' +
                h(record.id) + '" aria-label="Excluir substituição"><i class="bi bi-trash"></i></button></div></td></tr>';
        }).join('');
        return '<section class="card mb-3 no-print"><div class="card-header"><strong>Vigências e substituições</strong></div><div class="card-body">' +
            '<p class="small text-muted">Registre a substituição para uma turma e disciplina específicas. A grade original não é alterada; no PDF, o substituto assume essas aulas somente durante o período informado, sem duplicar a carga do titular.</p>' +
            '<form id="teacher-substitution-form" class="row g-3 align-items-end" data-edit-id="' + h(editingSubstitution ? editingSubstitution.id : '') + '">' +
            '<div class="col-md-3"><label class="form-label" for="substitution-class">Turma</label><select class="form-select" id="substitution-class" name="turma_id" required>' +
            classOptions +
            '</select></div><div class="col-md-3"><label class="form-label" for="substitution-discipline">Disciplina</label><select class="form-select" id="substitution-discipline" name="disciplina_id" required' +
            (selectedClassId ? '' : ' disabled') + '>' + disciplineOptions +
            '</select></div><div class="col-md-3"><label class="form-label" for="substitution-original-teacher">Professor substituído</label><select class="form-select" id="substitution-original-teacher" name="professor_original_id" required' +
            (selectedClassId && selectedDisciplineId ? '' : ' disabled') + '>' + originalTeacherOptions +
            '</select></div><div class="col-md-3"><label class="form-label" for="substitution-new-teacher">Professor substituto</label><select class="form-select" id="substitution-new-teacher" name="professor_substituto_id" required' +
            (selectedClassId && selectedDisciplineId ? '' : ' disabled') + '>' + replacementTeacherOptions +
            '</select></div><div class="col-md-4"><label class="form-label" for="substitution-start">Início da vigência</label><input class="form-control" id="substitution-start" name="data_inicio" type="date" value="' +
            h(editingSubstitution ? editingSubstitution.data_inicio : declarationDateValue(new Date())) + '" required></div>' +
            '<div class="col-md-4"><label class="form-label" for="substitution-end">Fim da vigência (opcional)</label><input class="form-control" id="substitution-end" name="data_fim" type="date" value="' +
            h(editingSubstitution ? editingSubstitution.data_fim : '') + '"></div>' +
            '<div class="col-md-4 d-flex gap-2"><button class="btn btn-outline-primary flex-grow-1" type="submit"' + (assignments.length ? '' : ' disabled') +
            '><i class="bi bi-arrow-left-right me-1"></i>' + (editingSubstitution ? 'Salvar alterações' : 'Registrar substituição') + '</button>' +
            (editingSubstitution ? '<button class="btn btn-outline-secondary" type="button" data-action="cancel-teacher-substitution-edit">Cancelar</button>' : '') + '</div></form>' +
            '<div class="table-responsive mt-4"><table class="table table-sm table-hover align-middle mb-0"><thead><tr><th>Turma</th><th>Disciplina</th><th>Substituição</th><th>Vigência</th><th>Aulas afetadas</th><th></th></tr></thead><tbody>' +
            (rows || '<tr><td colspan="6" class="text-center text-muted py-3">Nenhuma substituição registrada para ' + h(semester) + '.</td></tr>') +
            '</tbody></table></div></div></section>';
    }

    function renderSubstitutionSelectOptions(records, placeholder, selectedId) {
        return '<option value="">' + h(placeholder) + '</option>' + records.map(function (record) {
            return '<option value="' + h(record.id) + '"' +
                (String(record.id) === String(selectedId || '') ? ' selected' : '') + '>' +
                h(record.nome || 'Registro') + '</option>';
        }).join('');
    }

    function getTeacherSubstitutionOptions(classId, disciplineId, startDate, assignments, semester, substitutions, editingSubstitution) {
        const disciplineIds = new Set();
        if (classId) {
            getDemandsForClass(classId, semester).forEach(function (demand) {
                disciplineIds.add(String(demand.disciplina_id));
            });
            assignments.forEach(function (assignment) {
                if (String(assignment.turma_id) === String(classId) && assignment.disciplina_id) {
                    disciplineIds.add(String(assignment.disciplina_id));
                }
            });
            if (editingSubstitution && String(editingSubstitution.turma_id) === String(classId)) {
                disciplineIds.add(String(editingSubstitution.disciplina_id));
            }
        }
        const disciplines = readRecords(KEYS.disciplinas).filter(function (discipline) {
            return disciplineIds.has(String(discipline.id));
        }).sort(function (a, b) {
            return String(a.nome || '').localeCompare(String(b.nome || ''), 'pt-BR');
        });
        const teachersById = new Map(activeRecords(KEYS.professores, ['ativo']).map(function (teacher) {
            return [String(teacher.id), teacher];
        }));
        assignments.forEach(function (assignment) {
            const teacherId = String(assignment.professor_id || '');
            const teacher = teacherId ? findById(KEYS.professores, teacherId) : null;
            if (teacher && !teachersById.has(teacherId)) teachersById.set(teacherId, teacher);
        });
        if (editingSubstitution) {
            [editingSubstitution.professor_original_id, editingSubstitution.professor_substituto_id].forEach(function (teacherId) {
                const teacher = findById(KEYS.professores, teacherId);
                if (teacher && !teachersById.has(String(teacherId))) teachersById.set(String(teacherId), teacher);
            });
        }
        const allTeachers = Array.from(teachersById.values()).sort(function (a, b) {
            return String(a.nome || '').localeCompare(String(b.nome || ''), 'pt-BR');
        });
        const originalTeacherIds = new Set();
        if (classId && disciplineId) {
            const priorSubstitutions = substitutions.filter(function (record) {
                return !editingSubstitution || String(record.id) !== String(editingSubstitution.id);
            });
            getDeclarationAssignments(
                assignments, semester, priorSubstitutions, startDate || declarationDateValue(new Date())
            ).forEach(function (assignment) {
                if (String(assignment.turma_id) === String(classId) &&
                    String(assignment.disciplina_id) === String(disciplineId) &&
                    assignment.professor_id) {
                    originalTeacherIds.add(String(assignment.professor_id));
                }
            });
            if (editingSubstitution &&
                String(editingSubstitution.turma_id) === String(classId) &&
                String(editingSubstitution.disciplina_id) === String(disciplineId)) {
                originalTeacherIds.add(String(editingSubstitution.professor_original_id));
            }
        }
        const originalTeachers = allTeachers.filter(function (teacher) {
            return originalTeacherIds.has(String(teacher.id));
        });
        return {
            disciplines: disciplines,
            originalTeachers: originalTeachers,
            allTeachers: allTeachers
        };
    }

    function updateTeacherSubstitutionFields(form) {
        const classField = form.elements.namedItem('turma_id');
        const disciplineField = form.elements.namedItem('disciplina_id');
        const originalTeacherField = form.elements.namedItem('professor_original_id');
        const replacementTeacherField = form.elements.namedItem('professor_substituto_id');
        const startDateField = form.elements.namedItem('data_inicio');
        const previousDisciplineId = disciplineField.value;
        const previousOriginalTeacherId = originalTeacherField.value;
        const previousReplacementTeacherId = replacementTeacherField.value;
        const semester = getSemester();
        const assignments = readSimulation(semester).assignments || [];
        const substitutions = readRecords(KEYS.substituicoes).filter(function (record) {
            return String(record.semestre_letivo || '') === semester;
        });
        const editingSubstitution = readRecords(KEYS.substituicoes).find(function (record) {
            return String(record.id) === String(form.dataset.editId || '');
        }) || null;
        const options = getTeacherSubstitutionOptions(
            classField.value, previousDisciplineId, startDateField.value, assignments,
            semester, substitutions, editingSubstitution
        );
        const validDiscipline = options.disciplines.some(function (discipline) {
            return String(discipline.id) === previousDisciplineId;
        });
        disciplineField.innerHTML = renderSubstitutionSelectOptions(
            options.disciplines, 'Selecione a disciplina', validDiscipline ? previousDisciplineId : ''
        );
        disciplineField.disabled = !classField.value;
        const selectedDisciplineId = disciplineField.value;
        const selectedOptions = getTeacherSubstitutionOptions(
            classField.value, selectedDisciplineId, startDateField.value, assignments,
            semester, substitutions, editingSubstitution
        );
        const validOriginalTeacher = selectedOptions.originalTeachers.some(function (teacher) {
            return String(teacher.id) === previousOriginalTeacherId;
        });
        originalTeacherField.innerHTML = renderSubstitutionSelectOptions(
            selectedOptions.originalTeachers, 'Selecione o professor substituído',
            validOriginalTeacher ? previousOriginalTeacherId : ''
        );
        originalTeacherField.disabled = !classField.value || !selectedDisciplineId;
        const validReplacementTeacher = selectedOptions.allTeachers.some(function (teacher) {
            return String(teacher.id) === previousReplacementTeacherId;
        });
        replacementTeacherField.innerHTML = renderSubstitutionSelectOptions(
            selectedOptions.allTeachers, 'Selecione o professor substituto',
            validReplacementTeacher ? previousReplacementTeacherId : ''
        );
        replacementTeacherField.disabled = !classField.value || !selectedDisciplineId;
    }

    function formatSubstitutionDate(value) {
        if (!value) return '—';
        const date = new Date(value + 'T00:00:00');
        return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString('pt-BR');
    }

    function getSubstitutionAffectedAssignments(assignments, semester, substitutions, substitution) {
        const earlierMappings = substitutions.filter(function (record) { return record !== substitution; });
        return getDeclarationAssignments(assignments, semester, earlierMappings, substitution.data_inicio).filter(function (assignment) {
            return String(assignment.turma_id) === String(substitution.turma_id) &&
                String(assignment.disciplina_id) === String(substitution.disciplina_id) &&
                String(assignment.professor_id) === String(substitution.professor_original_id);
        });
    }

    function saveTeacherSubstitution(form) {
        const data = new FormData(form);
        const semester = getSemester();
        const turmaId = String(data.get('turma_id') || '');
        const disciplineId = String(data.get('disciplina_id') || '');
        const originalTeacherId = String(data.get('professor_original_id') || '');
        const replacementTeacherId = String(data.get('professor_substituto_id') || '');
        const startDate = String(data.get('data_inicio') || '');
        const endDate = String(data.get('data_fim') || '');
        const editingId = String(form.dataset.editId || '');
        const existingRecord = editingId
            ? readRecords(KEYS.substituicoes).find(function (record) { return String(record.id) === editingId; })
            : null;
        if (editingId && !existingRecord) throw new Error('A substituição que está sendo editada não foi encontrada.');
        if (!turmaId || !disciplineId || !originalTeacherId || !replacementTeacherId || !startDate) {
            throw new Error('Preencha turma, disciplina, professores e data inicial da vigência.');
        }
        if (originalTeacherId === replacementTeacherId) throw new Error('O professor substituto deve ser diferente do professor substituído.');
        if (endDate && endDate < startDate) throw new Error('A data final da vigência não pode ser anterior à data inicial.');
        if (!findById(KEYS.professores, originalTeacherId)) throw new Error('O professor substituído não foi encontrado.');
        const grade = readSimulation(semester);
        const semesterSubstitutions = readRecords(KEYS.substituicoes).filter(function (record) {
            return String(record.semestre_letivo || '') === semester;
        });
        const priorSubstitutions = semesterSubstitutions.filter(function (record) {
            return String(record.id) !== editingId;
        });
        const effectiveAssignmentsAtStart = getDeclarationAssignments(
            grade.assignments, semester, priorSubstitutions, startDate
        );
        const affectedAssignments = effectiveAssignmentsAtStart.filter(function (assignment) {
            return String(assignment.turma_id) === turmaId &&
                String(assignment.disciplina_id) === disciplineId &&
                String(assignment.professor_id) === originalTeacherId;
        });
        if (!affectedAssignments.length) {
            throw new Error('O professor selecionado não tem aulas dessa disciplina atribuídas à turma na grade atual.');
        }
        const records = readRecords(KEYS.substituicoes);
        const overlaps = semesterSubstitutions.some(function (record) {
            if (String(record.id) === editingId ||
                String(record.turma_id) !== turmaId ||
                String(record.disciplina_id) !== disciplineId ||
                String(record.professor_original_id) !== originalTeacherId) return false;
            const existingEnd = record.data_fim || '9999-12-31';
            const newEnd = endDate || '9999-12-31';
            return startDate <= existingEnd && newEnd >= String(record.data_inicio || '');
        });
        if (overlaps) throw new Error('Já existe uma substituição com vigência sobreposta para esse professor, turma e disciplina.');
        const replacement = findById(KEYS.professores, replacementTeacherId);
        if (!replacement) throw new Error('O professor substituto não foi encontrado.');
        if (replacement.status && !['ativo', 'ativa'].includes(String(replacement.status).toLowerCase())) {
            throw new Error('Selecione um professor substituto ativo.');
        }
        const occupiedPeriods = affectedAssignments.filter(function (assignment) {
            return grade.assignments.some(function (other) {
                return String(other.professor_id) === replacementTeacherId &&
                    String(other.id) !== String(assignment.id) &&
                    String(other.dia_semana) === String(assignment.dia_semana) &&
                    String(other.horario_id) === String(assignment.horario_id);
            });
        });
        if (occupiedPeriods.length && !window.confirm('O professor substituto já tem ' + occupiedPeriods.length +
            ' aula(s) em períodos coincidentes. Deseja registrar mesmo assim?')) return;
        const newSubstitution = {
            id: existingRecord ? existingRecord.id : nextId(records),
            semestre_letivo: semester,
            turma_id: Number(turmaId),
            disciplina_id: Number(disciplineId),
            professor_original_id: Number(originalTeacherId),
            professor_substituto_id: Number(replacementTeacherId),
            turma_nome: nameById(KEYS.turmas, turmaId, 'Turma'),
            disciplina_nome: nameById(KEYS.disciplinas, disciplineId, 'Disciplina'),
            professor_original_nome: nameById(KEYS.professores, originalTeacherId, 'Professor'),
            professor_substituto_nome: replacement.nome || 'Professor',
            data_inicio: startDate,
            data_fim: endDate
        };
        const updatedRecords = existingRecord
            ? records.map(function (record) { return String(record.id) === editingId ? newSubstitution : record; })
            : records.concat(newSubstitution);
        getDeclarationAssignments(grade.assignments, semester, updatedRecords, startDate);
        saveRecords(KEYS.substituicoes, updatedRecords, 'SubstituicoesDocentes');
        teacherSubstitutionEditingId = '';
        render();
        notify(existingRecord ? 'Substituição atualizada sem alterar as demais aulas da grade.' : 'Substituição registrada sem alterar as demais aulas da grade.', 'success');
    }

    function deleteTeacherSubstitution(id) {
        const records = readRecords(KEYS.substituicoes);
        const record = records.find(function (item) { return String(item.id) === String(id); });
        if (!record) throw new Error('A substituição não foi encontrada.');
        if (!window.confirm('Excluir a substituição de ' +
            nameById(KEYS.professores, record.professor_original_id, record.professor_original_nome || 'Professor') + ' por ' +
            nameById(KEYS.professores, record.professor_substituto_id, record.professor_substituto_nome || 'Professor') + '?')) return;
        saveRecords(KEYS.substituicoes, records.filter(function (item) { return String(item.id) !== String(id); }), 'SubstituicoesDocentes');
        if (teacherSubstitutionEditingId === String(id)) teacherSubstitutionEditingId = '';
        render();
        notify('Substituição removida.', 'success');
    }

    function getTeacherAvailability(professorId, day, slotId) {
        const records = readRecords(KEYS.disponibilidade).filter(function (row) {
            return String(row.professor_id) === String(professorId) && semesterMatches(row) && row.dia_semana === day;
        });
        if (records.some(function (row) { return String(row.tipo || '').toLowerCase() === 'prd'; })) {
            return { available: false, isPrd: true, label: 'PRD neste dia · sem aulas' };
        }
        const exact = records.filter(function (row) { return String(row.horario_id || '') === String(slotId); });
        const dayWide = records.filter(function (row) { return !row.horario_id; });
        const value = exact.length ? exact[exact.length - 1].disponivel : dayWide.length ? dayWide[dayWide.length - 1].disponivel : null;
        if (value == null) {
            const anyTeacherRecords = readRecords(KEYS.disponibilidade).some(function (row) {
                return String(row.professor_id) === String(professorId) && semesterMatches(row);
            });
            return {
                available: null,
                label: anyTeacherRecords ? 'Sem disponibilidade cadastrada neste período' : 'Disponibilidade não cadastrada'
            };
        }
        return Number(value) === 1
            ? { available: true, label: 'Disponível neste período' }
            : { available: false, label: 'Indisponível neste período' };
    }

    function renderAssignmentGuidance(form) {
        const classId = form.dataset.classId;
        const subjectId = form.elements.namedItem('disciplina_id').value;
        const professorField = form.elements.namedItem('professor_id');
        const professorId = professorField ? professorField.value : '';
        const day = form.elements.namedItem('dia_semana').value;
        const slotId = form.elements.namedItem('horario_id').value;
        const state = readSimulation(getSemester());
        const assignments = state.assignments.filter(function (item) { return String(item.id) !== String(form.dataset.assignmentId || ''); });
        const demands = getDemandsForClass(classId);
        const demandRows = demands.map(function (demand) {
            const allocated = assignments.filter(function (item) {
                return String(item.turma_id) === String(classId) && String(item.disciplina_id) === String(demand.disciplina_id);
            }).length;
            const remaining = Math.max(0, demand.aulas_semanais - allocated);
            const selected = String(demand.disciplina_id) === String(subjectId);
            return '<div class="assignment-demand-row' + (selected ? ' is-selected' : '') + '"><span>' + h(demand.disciplina_nome) + '</span><strong>' +
                allocated + ' / ' + demand.aulas_semanais + '</strong><span class="' + (remaining ? 'text-primary' : 'text-success') + '">' +
                (remaining ? remaining + ' restante(s)' : 'completa') + '</span></div>';
        }).join('');
        const demandSummary = demands.length
            ? '<div class="assignment-demand-list">' + demandRows + '</div>'
            : '<div class="alert alert-warning py-2 mb-0">Esta turma ainda não tem demandas cadastradas. A aula poderá ser adicionada manualmente, mas não será comparada com uma carga prevista.</div>';
        const teacher = findById(KEYS.professores, professorId);
        const slot = findById(KEYS.horarios, slotId);
        let teacherSummary = '<div class="text-muted">Selecione um professor e período para consultar a disponibilidade e carga.</div>';
        if (teacher && slot) {
            const teacherAssignments = assignments.filter(function (item) { return String(item.professor_id) === String(professorId); });
            const weeklyLimit = Number(teacher.carga_horaria_semanal == null ? 40 : teacher.carga_horaria_semanal);
            const dailyLimit = Number(teacher.limite_aulas_dia == null ? 5 : teacher.limite_aulas_dia);
            const weeklyLoad = teacherAssignments.length;
            const dailyLoad = teacherAssignments.filter(function (item) { return item.dia_semana === day; }).length;
            const availability = getTeacherAvailability(professorId, day, slotId);
            const conflict = teacherAssignments.some(function (item) {
                return String(item.dia_semana) === String(day) && String(item.horario_id) === String(slotId);
            });
            teacherSummary = '<div class="assignment-teacher-status' + (availability.available === false || conflict ? ' is-warning' : availability.available === true ? ' is-available' : '') + '">' +
                '<strong>' + h(availability.label) + '</strong>' + (conflict ? '<span>Já existe outra aula deste professor neste horário.</span>' : '') +
                '<span>Carga semanal: ' + weeklyLoad + ' / ' + weeklyLimit + ' aulas</span>' +
                '<span>Carga em ' + h(day) + ': ' + dailyLoad + ' / ' + dailyLimit + ' aulas</span></div>';
        }
        const demandHost = document.getElementById('assignment-demand-guidance');
        const teacherHost = document.getElementById('assignment-teacher-guidance');
        if (demandHost) demandHost.innerHTML = demandSummary;
        if (teacherHost) teacherHost.innerHTML = teacherSummary;
    }

    function getTeachersForDiscipline(disciplineId, includeTeacherId) {
        const activeTeachers = activeRecords(KEYS.professores, ['ativo']);
        const activeTeacherIds = new Set(activeTeachers.map(function (teacher) { return String(teacher.id); }));
        const vínculos = readRecords(KEYS.vinculos).filter(function (row) {
            return semesterMatches(row) && String(row.disciplina_id) === String(disciplineId);
        });
        const linkedIds = Array.from(new Set(vínculos.map(function (row) { return String(row.professor_id); })));
        const linkedTeachers = linkedIds.map(function (id) {
            return findById(KEYS.professores, id);
        }).filter(function (teacher) {
            return teacher && activeTeacherIds.has(String(teacher.id));
        });
        if (includeTeacherId && !linkedTeachers.some(function (teacher) { return String(teacher.id) === String(includeTeacherId); })) {
            const existingTeacher = findById(KEYS.professores, includeTeacherId);
            if (existingTeacher) linkedTeachers.push(existingTeacher);
        }
        return linkedTeachers;
    }

    function renderManualTeacherField(disciplineId, selectedTeacherId, includeTeacherId) {
        const teachers = getTeachersForDiscipline(disciplineId, includeTeacherId);
        if (!teachers.length) {
            return '<div class="alert alert-warning py-2 mb-0">Nenhum professor está vinculado a esta disciplina neste semestre. Cadastre o vínculo para adicionar a aula.</div>';
        }
        if (teachers.length === 1) {
            const teacher = teachers[0];
            return '<input type="hidden" name="professor_id" value="' + h(teacher.id) + '">' +
                '<div class="form-control-plaintext fw-semibold">' + h(teacher.nome) + ' <span class="text-muted fw-normal">(professor vinculado)</span></div>';
        }
        return '<select class="form-select" name="professor_id" id="manual-teacher" required>' +
            '<option value="">Selecione o professor</option>' +
            teachers.map(function (teacher) {
                return '<option value="' + h(teacher.id) + '"' + (String(selectedTeacherId) === String(teacher.id) ? ' selected' : '') + '>' + h(teacher.nome) + '</option>';
            }).join('') + '</select>';
    }

    function renderManualAssignment(turma, slots, assignment, targetDay, targetSlotId) {
        const disciplines = readRecords(KEYS.disciplinas);
        if (!turma) return '';
        const selectedDay = assignment ? assignment.dia_semana : targetDay;
        const selectedDemand = getDemandsForClass(turma.id).find(function (demand) {
            return assignment ? String(demand.disciplina_id) === String(assignment.disciplina_id) : demand.aulas_semanais > 0;
        });
        const selectedDisciplineId = assignment ? assignment.disciplina_id : selectedDemand ? selectedDemand.disciplina_id : disciplines[0] && disciplines[0].id;
        const initialTeachers = getTeachersForDiscipline(selectedDisciplineId, assignment && assignment.professor_id);
        const selectedTeacherId = assignment ? assignment.professor_id : initialTeachers.length === 1 ? initialTeachers[0].id : '';
        const slotOptions = slots.map(function (slot) {
            const selectedSlot = assignment ? String(assignment.horario_id) === String(slot.id) : targetSlotId ? String(targetSlotId) === String(slot.id) : selectedDay && slot.dia_semana === selectedDay;
            return '<option value="' + h(slot.id) + '" data-day="' + h(slot.dia_semana) + '"' + (selectedSlot ? ' selected' : '') + '>' +
                h(slot.dia_semana + ' · ' + slot.hora_inicio + '–' + slot.hora_fim) + '</option>';
        }).join('');
        const dialog = '<dialog class="assignment-dialog" id="manual-assignment-dialog" aria-labelledby="manual-assignment-title">' +
            '<div class="assignment-dialog-header"><div><h2 id="manual-assignment-title">' + (assignment ? 'Editar aula' : 'Adicionar aula à turma ' + h(turma.nome)) + '</h2>' +
            '<p class="mb-0 text-muted">' + (assignment ? 'Revise os dados da aula e as orientações antes de salvar.' : 'Escolha a disciplina. O professor será preenchido automaticamente quando houver apenas um vínculo.') + '</p></div>' +
            '<button type="button" class="btn-close" data-action="cancel-assignment-edit" aria-label="Fechar"></button></div>' +
            '<form id="manual-assignment-form" data-class-id="' + h(turma.id) + '"' +
            (assignment ? ' data-assignment-id="' + h(assignment.id) + '" data-original-discipline-id="' + h(assignment.disciplina_id) + '" data-original-professor-id="' + h(assignment.professor_id) + '"' : '') + '>' +
            '<div class="row g-3 mb-3"><div class="col-md-3"><label class="form-label" for="manual-day">Dia</label><select class="form-select" name="dia_semana" id="manual-day" required>' +
            DAYS.map(function (day) { return '<option value="' + h(day) + '"' + (selectedDay === day ? ' selected' : '') + '>' + h(day) + '</option>'; }).join('') + '</select></div>' +
            '<div class="col-md-3"><label class="form-label" for="manual-slot">Período</label><select class="form-select" name="horario_id" id="manual-slot" required>' +
            slotOptions + '</select></div><div class="col-md-3"><label class="form-label" for="manual-subject">Disciplina</label><select class="form-select" name="disciplina_id" id="manual-subject" required>' +
            (disciplines.length ? disciplines.map(function (item) { return '<option value="' + h(item.id) + '"' + (String(selectedDisciplineId) === String(item.id) ? ' selected' : '') + '>' + h(item.nome) + '</option>'; }).join('') :
                '<option value="" selected disabled>Cadastre uma disciplina</option>') + '</select></div>' +
            '<div class="col-md-3" id="manual-teacher-field"><label class="form-label">Professor</label>' +
            renderManualTeacherField(selectedDisciplineId, selectedTeacherId, assignment && assignment.professor_id) + '</div></div>' +
            '<section class="assignment-guidance-section"><h3>Demandas da turma</h3><div id="assignment-demand-guidance"></div></section>' +
            '<section class="assignment-guidance-section"><h3>Disponibilidade e carga do professor</h3><div id="assignment-teacher-guidance"></div></section>' +
            '<div class="d-flex flex-wrap gap-2 mt-4"><button class="btn btn-primary" type="submit"><i class="bi bi-save me-1"></i>' + (assignment ? 'Salvar alteração' : 'Adicionar aula') + '</button>' +
            (assignment ? '<button class="btn btn-outline-danger ms-auto" type="button" data-action="delete-assignment" data-id="' + h(assignment.id) + '">Excluir aula</button>' : '') +
            '<button class="btn btn-outline-secondary" type="button" data-action="cancel-assignment-edit">Cancelar</button></div></form></dialog>';
        return dialog;
    }

    function openAssignmentDialog() {
        render();
        const dialog = document.getElementById('manual-assignment-dialog');
        const form = document.getElementById('manual-assignment-form');
        if (!dialog || !form) throw new Error('Não foi possível abrir o formulário de aula. Selecione uma turma e um horário válido.');
        if (!dialog.open) dialog.showModal();
        renderAssignmentGuidance(form);
    }

    function readSimulation(semester) {
        if (!window.OwltimeGradeLocal) throw new Error('O armazenamento da grade não foi carregado. Atualize a página e tente novamente.');
        return window.OwltimeGradeLocal.loadState(semester);
    }

    function simulationKey(semester) {
        return 'owltime_simulacao_painel_' + (semester || 'default');
    }

    function saveSimulation(semester, state) {
        const key = window.OwltimeGradeLocal ? window.OwltimeGradeLocal.getStorageKey(semester) : simulationKey(semester);
        localStorage.setItem(key, JSON.stringify(state));
    }

    function addManualAssignment(form) {
        const data = new FormData(form);
        const turmaId = String(form.dataset.classId || '');
        const assignmentId = String(form.dataset.assignmentId || '');
        const day = String(data.get('dia_semana') || '');
        const slotId = Number(data.get('horario_id') || 0);
        const subjectId = Number(data.get('disciplina_id') || 0);
        const teacherId = Number(data.get('professor_id') || 0);
        if (!teacherId) throw new Error('Selecione uma disciplina com professor vinculado para adicionar a aula.');
        const slot = findById(KEYS.horarios, slotId);
        const subject = findById(KEYS.disciplinas, subjectId);
        const teacher = findById(KEYS.professores, teacherId);
        if (!turmaId || !slot || !subject || !teacher || slot.dia_semana !== day) throw new Error('Revise a turma, o dia, o horário, a disciplina e o professor selecionados.');
        const semester = getSemester();
        const state = readSimulation(semester);
        const oldAssignment = assignmentId ? state.assignments.find(function (item) { return String(item.id) === assignmentId; }) : null;
        if (assignmentId && !oldAssignment) throw new Error('A aula que você tentou editar não foi encontrada.');
        if (getGradeProtections(semester).some(function (protection) {
            return String(protection.turma_id) === turmaId &&
                String(protection.dia_semana) === day &&
                String(protection.horario_id) === String(slotId);
        })) throw new Error('Este período está protegido para a turma e não pode receber uma aula.');
        const remainingAssignments = state.assignments.filter(function (item) { return String(item.id) !== assignmentId; });
        const conflict = state.assignments.find(function (item) {
            if (String(item.id) === assignmentId) return false;
            if (String(item.dia_semana) !== day || String(item.horario_id) !== String(slotId)) return false;
            return String(item.turma_id) === turmaId || String(item.professor_id) === String(teacherId);
        });
        const warnings = [];
        if (conflict) warnings.push('Este horário já está ocupado para a turma ou para o professor.');
        const demands = getDemandsForClass(turmaId);
        const demand = demands.find(function (item) { return String(item.disciplina_id) === String(subjectId); });
        const allocated = remainingAssignments.filter(function (item) {
            return String(item.turma_id) === turmaId && String(item.disciplina_id) === String(subjectId);
        }).length;
        if (!demand) warnings.push('Esta disciplina não tem demanda cadastrada para a turma.');
        else if (allocated >= demand.aulas_semanais) warnings.push('A demanda semanal desta disciplina já foi atendida (' + allocated + ' / ' + demand.aulas_semanais + ').');

        const availability = getTeacherAvailability(teacherId, day, slotId);
        if (availability.isPrd) throw new Error('O professor está em PRD neste dia e não pode receber aulas.');
        if (availability.available === false) warnings.push('O professor está marcado como indisponível neste período.');
        const weeklyLimit = Number(teacher.carga_horaria_semanal == null ? 40 : teacher.carga_horaria_semanal);
        const dailyLimit = Number(teacher.limite_aulas_dia == null ? 5 : teacher.limite_aulas_dia);
        const weeklyLoad = remainingAssignments.filter(function (item) { return String(item.professor_id) === String(teacherId); }).length;
        const dailyLoad = remainingAssignments.filter(function (item) {
            return String(item.professor_id) === String(teacherId) && item.dia_semana === day;
        }).length;
        if (weeklyLoad >= weeklyLimit) warnings.push('O professor atingirá ou ultrapassará o limite semanal (' + weeklyLoad + ' / ' + weeklyLimit + ').');
        if (dailyLoad >= dailyLimit) warnings.push('O professor atingirá ou ultrapassará o limite diário (' + dailyLoad + ' / ' + dailyLimit + ').');
        if (warnings.length && !window.confirm(warnings.join('\n') + '\n\nDeseja salvar mesmo assim?')) return;
        const updatedAssignment = Object.assign({}, oldAssignment || {}, {
            id: oldAssignment ? oldAssignment.id : nextId(state.assignments),
            turma_id: Number(turmaId), dia_semana: day, horario_id: slotId,
            disciplina_id: subjectId, disciplina_nome: subject.nome,
            professor_id: teacherId, professor_nome: teacher.nome,
            hora_inicio: slot.hora_inicio, hora_fim: slot.hora_fim, origem: 'manual'
        });
        state.assignments = oldAssignment
            ? state.assignments.map(function (item) { return String(item.id) === assignmentId ? updatedAssignment : item; })
            : state.assignments.concat(updatedAssignment);
        state.activeTurmaId = Number(turmaId);
        saveSimulation(semester, state);
        gradeEditingId = null;
        gradeFocusDay = '';
        gradeFocusSlotId = '';
        render();
        notify(oldAssignment ? 'Aula atualizada na grade local.' : 'Aula adicionada à grade local.', 'success');
    }

    function moveAssignment(assignmentId, classId, day, slotId) {
        const semester = getSemester();
        const state = readSimulation(semester);
        const assignment = state.assignments.find(function (item) { return String(item.id) === String(assignmentId); });
        const slot = findById(KEYS.horarios, slotId);
        if (!assignment || String(assignment.turma_id) !== String(classId)) throw new Error('A aula ou a turma de destino não foi encontrada.');
        if (!slot || slot.dia_semana !== day || String(slot.tipo || 'Aula').toLowerCase() !== 'aula') {
            throw new Error('O horário de destino não é um período de aula válido.');
        }
        if (String(assignment.dia_semana) === String(day) && String(assignment.horario_id) === String(slotId)) return;
        if (getGradeProtections(semester).some(function (protection) {
            return String(protection.turma_id) === String(classId) &&
                String(protection.dia_semana) === String(day) &&
                String(protection.horario_id) === String(slotId);
        })) throw new Error('Este período está protegido para a turma e não pode receber uma aula.');
        const otherAssignments = state.assignments.filter(function (item) { return String(item.id) !== String(assignmentId); });
        if (otherAssignments.some(function (item) {
            return String(item.turma_id) === String(classId) && String(item.dia_semana) === String(day) && String(item.horario_id) === String(slotId);
        })) {
            throw new Error('A turma já tem uma aula neste horário. Escolha um horário vazio.');
        }
        const warnings = [];
        if (otherAssignments.some(function (item) {
            return String(item.professor_id) === String(assignment.professor_id) && String(item.dia_semana) === String(day) && String(item.horario_id) === String(slotId);
        })) warnings.push('O professor já tem outra aula neste período.');
        const availability = getTeacherAvailability(assignment.professor_id, day, slotId);
        if (availability.isPrd) throw new Error('O professor está em PRD neste dia e a aula não pode ser movida para esse período.');
        if (availability.available === false) warnings.push('O professor está marcado como indisponível neste período.');
        if (warnings.length && !window.confirm(warnings.join('\n') + '\n\nDeseja mover a aula mesmo assim?')) return;
        assignment.dia_semana = day;
        assignment.horario_id = Number(slotId);
        assignment.hora_inicio = slot.hora_inicio;
        assignment.hora_fim = slot.hora_fim;
        assignment.origem = 'manual';
        state.activeTurmaId = Number(classId);
        saveSimulation(semester, state);
        render();
        notify('Aula movida para ' + day + ', ' + slot.hora_inicio + '–' + slot.hora_fim + '.', 'success');
    }

    function removeAssignment(id) {
        const semester = getSemester();
        const state = readSimulation(semester);
        state.assignments = state.assignments.filter(function (item) { return String(item.id) !== String(id); });
        saveSimulation(semester, state);
        gradeEditingId = null;
        gradeFocusDay = '';
        gradeFocusSlotId = '';
        render();
        notify('Aula removida da grade.', 'success');
    }

    function exportJson(filename, data) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    }

    function exportBackup() {
        const backup = {};
        for (let index = 0; index < localStorage.length; index += 1) {
            const key = localStorage.key(index);
            if (key && key.startsWith('owltime_')) backup[key] = localStorage.getItem(key);
        }
        if (!Object.keys(backup).length) {
            notify('Ainda não há dados Owltime para exportar.', 'warning');
            return;
        }
        exportJson('owltime_backup_' + new Date().toISOString().slice(0, 10) + '.json', backup);
        notify('Backup exportado. Guarde o arquivo em um local seguro.', 'success');
    }

    function normalizeBackup(payload) {
        const source = payload && payload.storage && typeof payload.storage === 'object' ? payload.storage :
            (payload && payload.data && typeof payload.data === 'object' ? payload.data : payload);
        if (!source || typeof source !== 'object' || Array.isArray(source)) throw new Error('O arquivo selecionado não contém um backup Owltime válido.');
        const entries = Object.entries(source).filter(function (entry) { return entry[0].startsWith('owltime_'); });
        if (!entries.length) throw new Error('Nenhuma chave Owltime foi encontrada no arquivo.');
        const validated = {};
        entries.forEach(function (entry) {
            const key = entry[0];
            const value = entry[1];
            const serialized = typeof value === 'string' ? value : JSON.stringify(value);
            if (serialized === undefined) throw new Error('O valor da chave ' + key + ' não pode ser restaurado.');
            if (!PLAIN_TEXT_PREFERENCE_KEYS.includes(key)) {
                let parsed;
                try { parsed = JSON.parse(serialized); } catch (error) {
                    throw new Error('O conteúdo da chave ' + key + ' não é JSON válido.');
                }
                if (!(Array.isArray(parsed) || (parsed && typeof parsed === 'object'))) {
                    throw new Error('O conteúdo da chave ' + key + ' não tem um formato de dados reconhecido.');
                }
            }
            validated[key] = serialized;
        });
        return validated;
    }

    function restoreBackup(payload) {
        const values = normalizeBackup(payload);
        if (!window.confirm('A restauração substituirá as chaves locais que aparecem no backup. Deseja continuar?')) return;
        const previous = {};
        Object.keys(values).forEach(function (key) { previous[key] = localStorage.getItem(key); });
        try {
            Object.keys(values).forEach(function (key) { localStorage.setItem(key, values[key]); });
        } catch (error) {
            Object.keys(previous).forEach(function (key) {
                try {
                    if (previous[key] === null) localStorage.removeItem(key);
                    else localStorage.setItem(key, previous[key]);
                } catch (rollbackError) {
                    console.error('Falha ao restaurar a chave durante rollback:', key, rollbackError);
                }
            });
            throw new Error('Não foi possível restaurar o backup. Verifique o espaço disponível no navegador. ' + error.message);
        }
        editing = null;
        render();
        notify(Object.keys(values).length + ' chave(s) restaurada(s) neste navegador.', 'success');
    }

    function renderStorage() {
        const items = [];
        for (let index = 0; index < localStorage.length; index += 1) {
            const key = localStorage.key(index);
            if (!key || !key.startsWith('owltime_')) continue;
            const raw = localStorage.getItem(key) || '';
            let moduleName = PLAIN_TEXT_PREFERENCE_KEYS.includes(key) ? 'Preferências locais' : 'Configuração';
            if (!PLAIN_TEXT_PREFERENCE_KEYS.includes(key)) {
                try {
                    const parsed = JSON.parse(raw);
                    if (parsed && parsed.module) moduleName = parsed.module;
                    else if (Array.isArray(parsed)) moduleName = 'Registros';
                    else if (parsed && Array.isArray(parsed.records)) moduleName = parsed.module || 'Registros';
                    else if (parsed && Array.isArray(parsed.assignments)) moduleName = 'Grade';
                } catch (error) {
                    moduleName = 'JSON inválido';
                }
            }
            items.push({ key: key, moduleName: moduleName, bytes: new Blob([raw]).size });
        }
        items.sort(function (a, b) { return a.key.localeCompare(b.key); });
        const rows = items.map(function (item) {
            return '<tr><td><input class="form-check-input storage-check" type="checkbox" value="' + h(item.key) + '" aria-label="Selecionar ' + h(item.key) + '"></td>' +
                '<td class="storage-key">' + h(item.key) + '</td><td>' + h(item.moduleName) + '</td><td class="text-end">' + formatBytes(item.bytes) + '</td>' +
                '<td class="text-end"><button class="btn btn-sm btn-outline-danger" type="button" data-action="delete-storage-key" data-key="' + h(item.key) + '">Excluir</button></td></tr>';
        }).join('');
        return pageHeader('Armazenamento e backup', 'bi-hdd-stack', 'Inspecione e proteja os registros locais. O conteúdo não é enviado para o site.') +
            '<div class="alert local-callout"><strong>Importante:</strong> o localStorage é específico deste navegador e dispositivo. Limpar os dados do navegador pode apagá-los permanentemente; mantenha cópias exportadas.</div>' +
            '<div class="d-flex flex-wrap gap-2 mb-3 no-print"><button class="btn btn-primary" type="button" data-action="export-backup"><i class="bi bi-download me-1"></i>Exportar backup</button>' +
            '<button class="btn btn-outline-primary" type="button" data-action="pick-backup"><i class="bi bi-upload me-1"></i>Importar backup</button>' +
            '<button class="btn btn-outline-warning" type="button" data-action="delete-selected-storage">Excluir selecionadas</button>' +
            '<button class="btn btn-danger" type="button" data-action="clear-storage">Limpar dados Owltime</button>' +
            '<input id="backup-file" class="d-none" type="file" accept=".json,application/json"></div>' +
            '<div class="card"><div class="card-header d-flex justify-content-between"><strong>Chaves locais (' + items.length + ')</strong><button class="btn btn-sm btn-outline-secondary no-print" type="button" data-action="toggle-storage-checks">Selecionar tudo</button></div>' +
            '<div class="table-responsive"><table class="table table-hover align-middle mb-0"><thead><tr><th></th><th>Chave</th><th>Módulo</th><th class="text-end">Tamanho</th><th></th></tr></thead><tbody>' +
            (rows || '<tr><td colspan="5"><div class="empty-state"><i class="bi bi-hdd"></i>Nenhum dado Owltime salvo neste navegador.</div></td></tr>') +
            '</tbody></table></div></div>';
    }

    function formatBytes(bytes) {
        if (!bytes) return '0 B';
        if (bytes < 1024) return bytes + ' B';
        return (bytes / 1024).toFixed(1) + ' KB';
    }

    function renderReports() {
        const semester = getSemester();
        const state = readSimulation(semester);
        const lastReport = state.lastGenerationReport;
        const allAssignments = state.assignments || [];
        const teachers = readRecords(KEYS.professores);
        const activeTeachers = activeRecords(KEYS.professores, ['ativo']);
        const classes = activeRecords(KEYS.turmas, ['ativa', 'ativo']);
        const courses = activeRecords(KEYS.cursos, ['ativo', 'ativa']);
        const disciplines = readRecords(KEYS.disciplinas);
        const normalizeReportSearch = function (value) {
            return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');
        };
        if (reportCourseFilter && !courses.some(function (course) { return String(course.id) === reportCourseFilter; })) reportCourseFilter = '';
        const selectedCourse = courses.find(function (course) { return String(course.id) === reportCourseFilter; });
        const courseClasses = reportCourseFilter ? classes.filter(function (turma) {
            return String(turma.curso_id || '') === reportCourseFilter ||
                (!turma.curso_id && normalizeReportSearch(turma.curso_nome) === normalizeReportSearch(selectedCourse && selectedCourse.nome));
        }) : classes;
        const courseClassIds = new Set(courseClasses.map(function (turma) { return String(turma.id); }));
        const courseTeacherIds = new Set(allAssignments.filter(function (item) {
            return courseClassIds.has(String(item.turma_id));
        }).map(function (item) { return String(item.professor_id || ''); }));
        const reportTeachers = reportCourseFilter
            ? activeTeachers.filter(function (teacher) { return courseTeacherIds.has(String(teacher.id)); })
            : activeTeachers;
        if (reportTeacherFilter && !reportTeachers.some(function (teacher) { return String(teacher.id) === reportTeacherFilter; })) reportTeacherFilter = '';
        if (reportTurmaFilter && !courseClasses.some(function (turma) { return String(turma.id) === reportTurmaFilter; })) reportTurmaFilter = '';
        if (reportDisciplineFilter && !disciplines.some(function (discipline) { return String(discipline.id) === reportDisciplineFilter; })) reportDisciplineFilter = '';
        const searchQuery = normalizeReportSearch(reportSearchQuery.trim());
        const selectedTeacher = reportTeachers.find(function (teacher) { return String(teacher.id) === reportTeacherFilter; });
        const selectedClass = courseClasses.find(function (turma) { return String(turma.id) === reportTurmaFilter; });
        const selectedDiscipline = disciplines.find(function (discipline) { return String(discipline.id) === reportDisciplineFilter; });
        const filteredAssignments = allAssignments.filter(function (item) {
            if (reportCourseFilter && !courseClassIds.has(String(item.turma_id))) return false;
            if (reportTeacherFilter && String(item.professor_id) !== reportTeacherFilter) return false;
            if (reportTurmaFilter && String(item.turma_id) !== reportTurmaFilter) return false;
            if (reportDisciplineFilter && String(item.disciplina_id) !== reportDisciplineFilter) return false;
            if (!searchQuery) return true;
            const teacher = findById(KEYS.professores, item.professor_id);
            const turma = findById(KEYS.turmas, item.turma_id);
            const discipline = findById(KEYS.disciplinas, item.disciplina_id);
            const searchable = [
                item.professor_nome, teacher && teacher.nome, item.turma_nome, turma && turma.nome,
                item.disciplina_nome, discipline && discipline.nome
            ].join(' ');
            return normalizeReportSearch(searchable).includes(searchQuery);
        });
        const filteredClasses = courseClasses.filter(function (turma) {
            return !reportTurmaFilter || String(turma.id) === reportTurmaFilter;
        });
        const demandRows = [];
        filteredClasses.forEach(function (turma) {
            getDemandsForClass(turma.id).forEach(function (demand) {
                if (reportDisciplineFilter && String(demand.disciplina_id) !== reportDisciplineFilter) return;
                const rawAllocated = allAssignments.filter(function (item) {
                    return String(item.turma_id) === String(turma.id) &&
                        String(item.disciplina_id) === String(demand.disciplina_id);
                });
                if (reportTeacherFilter && !rawAllocated.some(function (item) {
                    return String(item.professor_id) === reportTeacherFilter;
                })) return;
                if (searchQuery) {
                    const teacherNames = rawAllocated.map(function (item) {
                        const teacher = findById(KEYS.professores, item.professor_id);
                        return item.professor_nome || (teacher && teacher.nome) || '';
                    }).join(' ');
                    const searchable = normalizeReportSearch([turma.nome, demand.disciplina_nome, teacherNames].join(' '));
                    if (!searchable.includes(searchQuery)) return;
                }
                const allocated = filteredAssignments.filter(function (item) {
                    return String(item.turma_id) === String(turma.id) &&
                        String(item.disciplina_id) === String(demand.disciplina_id);
                });
                const teachersByDiscipline = new Map();
                allocated.forEach(function (item) {
                    const teacherId = String(item.professor_id || '');
                    const teacher = findById(KEYS.professores, teacherId);
                    const teacherName = item.professor_nome || (teacher && teacher.nome) || 'Sem professor';
                    const summary = teachersByDiscipline.get(teacherId) || { nome: teacherName, aulas: 0 };
                    summary.aulas += 1;
                    teachersByDiscipline.set(teacherId, summary);
                });
                demandRows.push({
                    turma: turma.nome || 'Turma',
                    turma_id: turma.id,
                    disciplina: demand.disciplina_nome || nameById(KEYS.disciplinas, demand.disciplina_id, 'Disciplina'),
                    disciplina_id: demand.disciplina_id,
                    previstas: demand.aulas_semanais,
                    alocadas: allocated.length,
                    pendentes: Math.max(0, demand.aulas_semanais - allocated.length),
                    professores: Array.from(teachersByDiscipline.values()).sort(function (a, b) {
                        return a.nome.localeCompare(b.nome, 'pt-BR');
                    })
                });
            });
        });
        const lessonRangeMatches = function (count) {
            return (reportMinimumLessons === '' || count >= Number(reportMinimumLessons)) &&
                (reportMaximumLessons === '' || count <= Number(reportMaximumLessons));
        };
        const reportClasses = filteredClasses.filter(function (turma) {
            const classRows = demandRows.filter(function (row) { return String(row.turma_id) === String(turma.id); });
            const classSearch = normalizeReportSearch(turma.nome).includes(searchQuery);
            const hasRelevantDemand = classRows.length > 0;
            const classHasSearchMatch = (!searchQuery || classSearch || hasRelevantDemand) &&
                (!(reportTeacherFilter || reportDisciplineFilter) || hasRelevantDemand);
            const classLessons = filteredAssignments.filter(function (item) { return String(item.turma_id) === String(turma.id); }).length;
            return classHasSearchMatch && lessonRangeMatches(classLessons);
        });
        const reportClassIds = new Set(reportClasses.map(function (turma) { return String(turma.id); }));
        const visibleDemandRows = demandRows.filter(function (row) { return reportClassIds.has(String(row.turma_id)); });
        const totalDemand = visibleDemandRows.reduce(function (sum, row) { return sum + row.previstas; }, 0);
        const totalPending = visibleDemandRows.reduce(function (sum, row) { return sum + row.pendentes; }, 0);
        const completion = totalDemand ? Math.round((totalDemand - totalPending) / totalDemand * 100) : 0;
        const teachersInScope = reportCourseFilter ? reportTeachers : teachers;
        const teacherTotals = new Map(teachersInScope.map(function (teacher) {
            return [String(teacher.id), { id: teacher.id, nome: teacher.nome || 'Professor', aulas: 0 }];
        }));
        const classTotals = new Map();
        const disciplineTotals = new Map();
        filteredAssignments.forEach(function (item) {
            const teacherId = String(item.professor_id || '');
            const classId = String(item.turma_id || '');
            const disciplineId = String(item.disciplina_id || '');
            const teacher = findById(KEYS.professores, teacherId);
            const turma = findById(KEYS.turmas, classId);
            const discipline = findById(KEYS.disciplinas, disciplineId);
            const teacherName = item.professor_nome || (teacher && teacher.nome) || 'Sem professor';
            const className = (turma && turma.nome) || 'Turma removida';
            const disciplineName = item.disciplina_nome || (discipline && discipline.nome) || 'Disciplina removida';
            if (!teacherTotals.has(teacherId)) {
                teacherTotals.set(teacherId, { id: teacherId, nome: teacherName, aulas: 0 });
            }
            teacherTotals.get(teacherId).aulas += 1;
            const classSummary = classTotals.get(classId) || { id: classId, nome: className, aulas: 0 };
            classSummary.aulas += 1;
            classTotals.set(classId, classSummary);
            const disciplineSummary = disciplineTotals.get(disciplineId) || {
                id: disciplineId, nome: disciplineName, aulas: 0
            };
            disciplineSummary.aulas += 1;
            disciplineTotals.set(disciplineId, disciplineSummary);
        });
        const hasNarrowingFilter = Boolean(reportCourseFilter || searchQuery || reportTeacherFilter || reportTurmaFilter || reportDisciplineFilter);
        const teacherRanking = Array.from(teacherTotals.values()).filter(function (teacher) {
            return (!hasNarrowingFilter || teacher.aulas > 0 || String(teacher.id) === reportTeacherFilter) &&
                lessonRangeMatches(teacher.aulas);
        }).sort(function (a, b) {
            return b.aulas - a.aulas || a.nome.localeCompare(b.nome, 'pt-BR');
        });
        const classRanking = Array.from(classTotals.values()).filter(function (turma) {
            return lessonRangeMatches(turma.aulas);
        }).sort(function (a, b) {
            return b.aulas - a.aulas || a.nome.localeCompare(b.nome, 'pt-BR');
        });
        const disciplineRanking = Array.from(disciplineTotals.values()).filter(function (discipline) {
            return lessonRangeMatches(discipline.aulas);
        }).sort(function (a, b) {
            return b.aulas - a.aulas || a.nome.localeCompare(b.nome, 'pt-BR');
        });
        function emptyRow(columns, message) {
            return '<tr><td colspan="' + columns + '" class="text-center text-muted py-4">' + message + '</td></tr>';
        }
        function pieChart(title, items, colorFor) {
            const values = items.filter(function (item) { return item.aulas > 0; });
            const total = values.reduce(function (sum, item) { return sum + item.aulas; }, 0);
            let current = 0;
            const stops = values.map(function (item, index) {
                const start = current;
                current += item.aulas / total * 100;
                const color = colorFor(item, index);
                return color + ' ' + start.toFixed(2) + '% ' + current.toFixed(2) + '%';
            });
            const legend = values.map(function (item, index) {
                const color = colorFor(item, index);
                return '<li><i style="--report-chart-color:' + color + '"></i><span>' + h(item.nome) +
                    '</span><strong>' + item.aulas + ' (' + Math.round(item.aulas / total * 100) + '%)</strong></li>';
            }).join('');
            return '<section class="card h-100"><div class="card-header">' + h(title) + '</div><div class="card-body">' +
                (total ? '<div class="report-pie-layout"><div class="report-pie" role="img" aria-label="' + h(title + ', ' + total + ' aulas') +
                    '" style="background:conic-gradient(' + stops.join(',') + ')"><div><strong>' + total + '</strong><span>aulas</span></div></div>' +
                    '<ul class="report-pie-legend">' + legend + '</ul></div>' :
                    '<div class="empty-state py-4"><i class="bi bi-pie-chart"></i>Sem aulas alocadas neste semestre.</div>') +
                '</div></section>';
        }
        function barChart(title, items) {
            const values = items;
            const maximum = Math.max.apply(null, values.map(function (item) { return item.aulas; }).concat([1]));
            const bars = values.map(function (item) {
                const width = item.aulas ? Math.max(3, Math.round(item.aulas / maximum * 100)) : 0;
                const color = item.id ? subjectColor(item.id) : '#dceeff';
                return '<div class="report-bar-row"><span class="report-bar-label" title="' + h(item.nome) + '">' + h(item.nome) +
                    '</span><div class="report-bar-track"><i style="width:' + width + '%;--report-bar-color:' + color + '"></i></div>' +
                    '<strong>' + item.aulas + '</strong></div>';
            }).join('');
            return '<section class="card h-100"><div class="card-header">' + h(title) + '</div><div class="card-body">' +
                (bars || '<div class="empty-state py-4"><i class="bi bi-bar-chart"></i>Sem aulas alocadas neste semestre.</div>') +
                '</div></section>';
        }
        const teacherRows = teacherRanking.map(function (teacher, index) {
            const share = filteredAssignments.length ? Math.round(teacher.aulas / filteredAssignments.length * 100) : 0;
            return '<tr><td><span class="report-rank">' + (index + 1) + '</span></td><td>' + h(teacher.nome) +
                '</td><td class="text-end fw-semibold">' + teacher.aulas + '</td><td><div class="report-share"><i style="width:' +
                share + '%"></i></div><span class="small text-muted">' + share + '% da grade</span></td></tr>';
        }).join('');
        const reportProtections = getGradeProtections(semester);
        const reportSlotsById = new Map(readRecords(KEYS.horarios).map(function (slot) {
            return [String(slot.id), slot];
        }));
        const classSummaries = reportClasses.map(function (turma) {
            const subjects = visibleDemandRows.filter(function (row) { return String(row.turma_id) === String(turma.id); });
            const planned = subjects.reduce(function (sum, row) { return sum + row.previstas; }, 0);
            const allocated = subjects.reduce(function (sum, row) { return sum + row.alocadas; }, 0);
            const complete = planned > 0 && subjects.every(function (row) { return row.alocadas === row.previstas; });
            const classProtections = reportProtections.filter(function (protection) {
                return String(protection.turma_id) === String(turma.id);
            }).sort(function (a, b) {
                const dayDifference = DAYS.indexOf(String(a.dia_semana || '')) - DAYS.indexOf(String(b.dia_semana || ''));
                if (dayDifference) return dayDifference;
                const slotA = reportSlotsById.get(String(a.horario_id)) || {};
                const slotB = reportSlotsById.get(String(b.horario_id)) || {};
                return String(slotA.hora_inicio || '').localeCompare(String(slotB.hora_inicio || ''));
            });
            const subjectList = subjects.map(function (row) {
                const teacherList = row.professores.length
                    ? row.professores.map(function (teacher) {
                        return h(teacher.nome) + ' <span class="report-teacher-lessons">(' + teacher.aulas + ')</span>';
                    }).join(', ')
                    : '<span class="text-muted">Sem professor alocado</span>';
                return '<div class="report-class-subject"><div class="report-class-subject-heading"><span class="demand-discipline"><i style="--demand-color:' +
                    subjectColor(row.disciplina_id) + '"></i><strong>' + h(row.disciplina) + '</strong></span><span class="report-subject-coverage">' +
                    row.alocadas + '/' + row.previstas + '</span></div><div class="report-class-teachers"><span>Professor(es):</span> ' +
                    teacherList + '</div></div>';
            }).join('');
            const protectionList = classProtections.map(function (protection) {
                const slot = reportSlotsById.get(String(protection.horario_id)) || {};
                const time = slot.hora_inicio && slot.hora_fim
                    ? ' · ' + slot.hora_inicio + '–' + slot.hora_fim
                    : '';
                const name = protection.peculiaridade_nome ||
                    nameById(KEYS.peculiaridades, protection.peculiaridade_id, 'Proteção');
                return '<li><strong>' + h(protection.dia_semana || 'Dia não informado') + h(time) +
                    '</strong><span class="report-protection-kind">' +
                    (protection.tipo_marcacao === 'evento' ? 'Evento: ' : 'Proteção: ') + h(name) + '</span></li>';
            }).join('');
            const protectionSummary = '<section class="report-class-protections" aria-label="Peculiaridades e eventos da turma ' +
                h(turma.nome || 'Turma') + '"><h3><i class="bi bi-shield-exclamation" aria-hidden="true"></i>Peculiaridades e eventos' +
                (classProtections.length ? ' <span>' + classProtections.length + '</span>' : '') + '</h3>' +
                (protectionList ? '<ul>' + protectionList + '</ul>' :
                    '<p>Nenhum horário protegido para esta turma neste semestre.</p>') + '</section>';
            return '<article class="card report-class-card"><div class="report-class-heading"><h2>' + h(turma.nome || 'Turma') +
                '</h2><span class="report-class-coverage ' + (complete ? 'is-complete' : 'is-pending') + '">' +
                allocated + '/' + planned + ' aulas preenchidas</span></div>' +
                '<div class="report-class-subjects">' + (subjectList || '<p class="text-muted mb-0">Nenhuma demanda cadastrada para esta turma.</p>') +
                '</div>' + protectionSummary + '</article>';
        }).join('');
        const generationCard = lastReport
            ? '<div class="card mb-3"><div class="card-header d-flex justify-content-between align-items-center gap-2 flex-wrap"><strong>Última geração automática</strong><span class="badge text-bg-' +
                (lastReport.completo ? 'success' : 'warning') + '">' + (lastReport.completo ? 'Completa' : 'Com pendências') + '</span></div><div class="card-body d-flex flex-wrap gap-4">' +
                '<span>Gerada em <strong>' + h(formatDate(lastReport.geradoEm || lastReport.generatedAt)) + '</strong></span><span>Previstas <strong>' +
                h(lastReport.totalPrevistas || 0) + '</strong></span><span>Preenchidas <strong>' + h(lastReport.totalAtendidas || 0) +
                '</strong></span><span>Pendentes na geração <strong>' + h(lastReport.totalPendentes || 0) + '</strong></span></div></div>'
            : '';
        const reportTeacherOptions = '<option value="">Todos os professores</option>' + reportTeachers.map(function (teacher) {
            return '<option value="' + h(teacher.id) + '"' + (String(teacher.id) === reportTeacherFilter ? ' selected' : '') + '>' +
                h(teacher.nome || 'Professor') + '</option>';
        }).join('');
        const courseOptions = '<option value="">Todos os cursos</option>' + courses.map(function (course) {
            return '<option value="' + h(course.id) + '"' + (String(course.id) === reportCourseFilter ? ' selected' : '') + '>' +
                h(course.nome || 'Curso') + '</option>';
        }).join('');
        const classOptions = '<option value="">Todas as turmas</option>' + courseClasses.map(function (turma) {
            return '<option value="' + h(turma.id) + '"' + (String(turma.id) === reportTurmaFilter ? ' selected' : '') + '>' +
                h(turma.nome || 'Turma') + '</option>';
        }).join('');
        const disciplineOptions = '<option value="">Todas as disciplinas</option>' + disciplines.map(function (discipline) {
            return '<option value="' + h(discipline.id) + '"' + (String(discipline.id) === reportDisciplineFilter ? ' selected' : '') + '>' +
                h(discipline.nome || 'Disciplina') + '</option>';
        }).join('');
        const appliedFilters = [
            searchQuery,
            selectedCourse && selectedCourse.nome,
            selectedTeacher && selectedTeacher.nome,
            selectedClass && selectedClass.nome,
            selectedDiscipline && selectedDiscipline.nome,
            reportMinimumLessons !== '' && 'mín. ' + reportMinimumLessons + ' aulas',
            reportMaximumLessons !== '' && 'máx. ' + reportMaximumLessons + ' aulas'
        ].filter(Boolean);
        return '<div class="report-screen-only">' + pageHeader('Relatórios', 'bi-bar-chart', 'Resumo das aulas por turma, disciplinas e professores.') + '</div>' +
            '<div class="report-print-header"><span>OWLTIME · GESTÃO ESCOLAR</span><h1>Relatório de aulas por turma</h1><p>Semestre ' + h(semester) +
            ' · Emitido em ' + h(new Date().toLocaleDateString('pt-BR')) + '</p></div>' +
            '<div class="card mb-3 no-print"><div class="card-body d-flex flex-wrap align-items-end gap-3"><div><label class="form-label" for="report-semester">Semestre</label><input class="form-control" id="report-semester" value="' + h(semester) + '" pattern="\\d{4}/[12]" placeholder="AAAA/1"></div>' +
            '<button class="btn btn-outline-primary" type="button" data-action="report-apply">Aplicar</button><button class="btn btn-outline-secondary" type="button" data-action="print"><i class="bi bi-file-earmark-pdf me-1"></i>Gerar PDF</button>' +
            '<button class="btn btn-outline-success" type="button" data-action="export-csv">Exportar grade CSV</button></div></div>' +
            '<div class="card mb-3 no-print"><div class="card-header d-flex align-items-center gap-2"><i class="bi bi-funnel"></i>Filtros dos relatórios</div><div class="card-body"><div class="row g-3 align-items-end">' +
            '<div class="col-md-6 col-xl-4"><label class="form-label" for="report-search">Buscar por professor, turma ou disciplina</label><input class="form-control" id="report-search" type="search" value="' + h(reportSearchQuery) + '" placeholder="Digite um nome"></div>' +
            '<div class="col-md-6 col-xl-2"><label class="form-label" for="report-course-filter">Curso</label><select class="form-select" id="report-course-filter">' + courseOptions + '</select></div>' +
            '<div class="col-md-6 col-xl-2"><label class="form-label" for="report-teacher-filter">Professor</label><select class="form-select" id="report-teacher-filter">' + reportTeacherOptions + '</select></div>' +
            '<div class="col-md-6 col-xl-2"><label class="form-label" for="report-class-filter">Turma</label><select class="form-select" id="report-class-filter">' + classOptions + '</select></div>' +
            '<div class="col-md-6 col-xl-2"><label class="form-label" for="report-discipline-filter">Disciplina</label><select class="form-select" id="report-discipline-filter">' + disciplineOptions + '</select></div>' +
            '<div class="col-6 col-xl-1"><label class="form-label" for="report-min-lessons">Mín. aulas</label><input class="form-control" id="report-min-lessons" type="number" min="0" step="1" value="' + h(reportMinimumLessons) + '" placeholder="0"></div>' +
            '<div class="col-6 col-xl-1"><label class="form-label" for="report-max-lessons">Máx. aulas</label><input class="form-control" id="report-max-lessons" type="number" min="0" step="1" value="' + h(reportMaximumLessons) + '" placeholder="—"></div>' +
            '<div class="col-12 d-flex flex-wrap align-items-center gap-2"><button class="btn btn-primary" type="button" data-action="apply-report-filters"><i class="bi bi-search me-1"></i>Filtrar relatórios</button>' +
            '<button class="btn btn-outline-secondary" type="button" data-action="clear-report-filters">Limpar filtros</button>' +
            '<span class="small text-muted">' + (appliedFilters.length ? h(appliedFilters.join(' · ')) : 'Os filtros atualizam indicadores, gráficos, ranking e resumo por turma. A quantidade considera as aulas preenchidas.') + '</span></div></div></div></div>' +
            '<div class="report-screen-only"><div class="row g-3 mb-3"><div class="col-6 col-xl-3"><div class="card report-kpi"><span>Aulas no recorte</span><strong>' + filteredAssignments.length +
            '</strong><small>alocações no semestre</small></div></div><div class="col-6 col-xl-3"><div class="card report-kpi"><span>Professores ativos</span><strong>' +
            (hasNarrowingFilter ? teacherRanking.length : activeTeachers.length) + '</strong><small>' + teacherRanking.filter(function (item) {
                return item.aulas > 0 && activeTeachers.some(function (teacher) { return String(teacher.id) === String(item.id); });
            }).length + ' com aulas no recorte</small></div></div>' +
            '<div class="col-6 col-xl-3"><div class="card report-kpi"><span>Turmas com aula</span><strong>' + classRanking.length + '</strong><small>de ' + reportClasses.length + ' no recorte</small></div></div>' +
            '<div class="col-6 col-xl-3"><div class="card report-kpi"><span>Atendimento das demandas</span><strong>' + completion + '%</strong><small>' + totalPending + ' aula(s) pendente(s) · ' + totalDemand + ' previstas</small></div></div></div>' +
            generationCard +
            '<div class="row g-3 mb-3"><div class="col-xl-6">' + barChart('Ranking de professores por aulas', teacherRanking) + '</div>' +
            '<div class="col-xl-6">' + pieChart('Distribuição de aulas por disciplina', disciplineRanking, function (item) { return subjectColor(item.id); }) + '</div></div>' +
            '<section class="card mb-3"><div class="card-header">Ranking de professores</div><div class="table-responsive"><table class="table table-hover align-middle mb-0"><thead><tr><th>#</th><th>Professor</th><th class="text-end">Aulas</th><th>Participação na grade</th></tr></thead><tbody>' +
            (teacherRows || emptyRow(4, 'Nenhum professor corresponde aos filtros selecionados.')) + '</tbody></table></div></section></div>' +
            '<section class="report-class-list"><div class="report-class-list-heading"><h2>Resumo por turma</h2><p>Disciplinas, aulas previstas e professores responsáveis.</p></div>' +
            (classSummaries || '<div class="empty-state"><i class="bi bi-journal-x"></i>Nenhuma turma ou demanda corresponde aos filtros selecionados.</div>') + '</section>';
    }

    function renderHelp() {
        return pageHeader('Ajuda e privacidade', 'bi-question-circle', 'O que significa operar o Owltime totalmente no navegador?') +
            '<div class="row g-3"><div class="col-lg-7"><div class="card"><div class="card-header">Como seus dados funcionam</div><div class="card-body">' +
            '<ul class="mb-0"><li class="mb-2">Cadastros, vínculos, demandas, notas e grades são salvos no <code>localStorage</code> deste navegador.</li>' +
            '<li class="mb-2">O Owltime não envia seus cadastros para um servidor. Os dados não são sincronizados entre dispositivos e não podem ser recuperados pelo administrador do site.</li>' +
            '<li class="mb-2">Use <strong>Armazenamento e backup → Exportar backup</strong> para baixar uma cópia e importe o arquivo para restaurá-la.</li>' +
            '<li>Se limpar os dados do navegador ou trocar de perfil/dispositivo, importe um backup para recuperar o trabalho.</li></ul></div></div></div>' +
            '<div class="col-lg-5"><div class="card"><div class="card-header">Limites importantes</div><div class="card-body"><div class="alert danger-callout mb-0">' +
            'Sem servidor, login e senhas não oferecem autenticação segura. Qualquer pessoa com acesso ao mesmo perfil do navegador pode abrir e alterar os dados. Não use este app para guardar informações que exijam controle de acesso ou sigilo.' +
            '</div></div></div></div>' +
            '<section class="col-12 tutorial-section"><div class="tutorial-heading"><div><span class="tutorial-eyebrow">PASSO A PASSO</span><h2>Tutorial guiado: da escola à grade</h2>' +
            '<p>Navegue pelos módulos e preencha os formulários com exemplos fictícios. Em cada etapa, o tutorial abre um painel com valores copiáveis.</p></div>' +
            '<span class="badge text-bg-primary">11 etapas · Gestão Pública · 2026/2</span></div>' +
            '<div class="alert alert-warning"><i class="bi bi-exclamation-triangle-fill me-2"></i>O tutorial não cria uma área de teste separada. Se salvar os exemplos, eles serão gravados nos cadastros deste navegador. Faça um backup antes de começar e restaure-o ao final, se quiser removê-los.</div>' +
            '<button type="button" class="btn btn-primary" data-action="start-tutorial"><i class="bi bi-play-circle me-1"></i>Iniciar tutorial</button></section>' +
            '<section class="col-12"><div class="card sharing-idea"><div class="card-body d-flex flex-wrap align-items-center justify-content-between gap-3"><div><span class="tutorial-eyebrow">COMPARTILHAMENTO</span><h2>Horários individuais</h2>' +
            '<p>Na Grade oficial, selecione uma turma ou professor para baixar um PDF bem formatado, enviá-lo diretamente pelo menu de compartilhamento do dispositivo, baixar CSV individual ou compartilhar um resumo.</p>' +
            '<p class="small mb-2">O Owltime funciona localmente; publicação por link público requer um serviço externo.</p><a class="btn btn-sm btn-outline-primary" href="#/grade"><i class="bi bi-calendar3 me-1"></i>Abrir Grade oficial</a></div><i class="bi bi-share"></i></div></div></section>';
    }

    function render() {
        const route = (window.location.hash.replace(/^#\/?/, '').split('/')[0] || 'dashboard');
        if (spreadsheetImport && spreadsheetImport.route !== route) spreadsheetImport = null;
        if (route !== 'grade' && route !== 'ajustes') {
            gradeEditingId = null;
            gradeFocusDay = '';
            gradeFocusSlotId = '';
            teacherSubstitutionEditingId = '';
        }
        document.querySelectorAll('.side-link').forEach(function (link) {
            link.classList.toggle('active', link.dataset.route === route);
        });
        try {
            editing = editing && editing.route === route ? editing : null;
            if (route === 'notas') view.innerHTML = renderNotes();
            else if (specs[route]) view.innerHTML = renderCrud(route);
            else if (route === 'dashboard') view.innerHTML = renderDashboard();
            else if (route === 'grade') view.innerHTML = renderGrade();
            else if (route === 'ajustes') view.innerHTML = renderGrade(true);
            else if (route === 'relatorios') view.innerHTML = renderReports();
            else if (route === 'armazenamento') view.innerHTML = renderStorage();
            else if (route === 'ajuda') view.innerHTML = renderHelp();
            else view.innerHTML = '<div class="empty-state"><i class="bi bi-exclamation-circle"></i>Página não encontrada.</div>';
            sortSelectOptions(view);
            ensureInputPlaceholders();
            if (route === 'disponibilidade') syncAvailabilityForm(document.getElementById('record-form'));
            if (route === 'ajustes') {
                const assignmentForm = document.getElementById('manual-assignment-form');
                const assignmentDialog = document.getElementById('manual-assignment-dialog');
                if (assignmentForm) renderAssignmentGuidance(assignmentForm);
                if (assignmentDialog) assignmentDialog.addEventListener('cancel', function () {
                    gradeEditingId = null;
                    gradeFocusDay = '';
                    gradeFocusSlotId = '';
                });
            }
            alertBox.classList.add('d-none');
        } catch (error) {
            console.error('Falha ao exibir o módulo:', error);
            view.innerHTML = pageHeader('Não foi possível abrir esta tela', 'bi-exclamation-triangle', '') +
                '<div class="alert alert-danger">' + h(error.message || 'Erro inesperado ao carregar dados locais.') + '</div>' +
                '<a class="btn btn-outline-primary" href="#/armazenamento">Abrir armazenamento e backup</a>';
        }
        renderTutorialGuide(route);
    }

    function collectForm(form, fields) {
        const values = {};
        fields.forEach(function (field) {
            const control = form.elements.namedItem(field.name);
            if (!control) return;
            let value = String(control.value || '').trim();
            if (field.type === 'number') value = value === '' ? 0 : Number(value);
            else if (field.name === 'disponivel') value = Number(value) === 1 ? 1 : 0;
            else if (field.type === 'select' && field.optionsFrom && field.optionsFrom === 'cursos' && value) {
                const course = findById(KEYS.cursos, value);
                values.curso_nome = course ? course.nome : '';
            }
            if (field.name.endsWith('_id')) value = value === '' ? null : Number(value);
            values[field.name] = value;
        });
        return values;
    }

    function submitRecord(form) {
        const route = form.dataset.route;
        const spec = specs[route];
        if (!spec) return;
        const values = collectForm(form, spec.fields);
        if (route === 'horarios' && values.hora_fim <= values.hora_inicio) throw new Error('O horário final precisa ser posterior ao horário inicial.');
        if (route === 'disponibilidade') {
            if (!DAYS.includes(values.dia_semana)) throw new Error('Selecione um dia válido.');
            if (!/^\d{4}\/[12]$/.test(String(values.semestre_letivo || ''))) {
                throw new Error('Informe o semestre no formato AAAA/1 ou AAAA/2.');
            }
            if (values.horario_id && values.tipo !== 'prd') {
                const slot = findById(KEYS.horarios, values.horario_id);
                if (!slot || slot.dia_semana !== values.dia_semana || String(slot.tipo || 'Aula').toLowerCase() !== 'aula') {
                    throw new Error('Selecione um horário de aula pertencente ao dia informado.');
                }
            }
            if (values.tipo === 'prd') {
                values.horario_id = null;
                values.disponivel = 0;
                const grade = readSimulation(values.semestre_letivo);
                const matchingLessons = grade.assignments.filter(function (assignment) {
                    return String(assignment.professor_id) === String(values.professor_id) &&
                        String(assignment.dia_semana) === String(values.dia_semana) &&
                        (!editing || editing.route !== route || String(assignment.id) !== String(editing.record.id));
                });
                if (matchingLessons.length) {
                    throw new Error('Este professor já tem ' + matchingLessons.length + ' aula(s) na grade de ' + values.dia_semana +
                        '. Realoque ou remova essas aulas antes de registrar o PRD.');
                }
            }
            const duplicate = readRecords(spec.key).some(function (row) {
                return String(row.id) !== String(editing && editing.id) &&
                    String(row.professor_id) === String(values.professor_id) &&
                    String(row.dia_semana) === String(values.dia_semana) &&
                    String(row.tipo || 'indisponibilidade') === String(values.tipo) &&
                    String(row.horario_id || '') === String(values.horario_id || '') &&
                    semesterMatches(row, values.semestre_letivo);
            });
            if (duplicate) throw new Error('Este registro de disponibilidade já existe para o professor nesse dia e semestre.');
        }
        if (route === 'vinculos') {
            const duplicate = readRecords(spec.key).some(function (row) {
                return String(row.id) !== String(editing && editing.id) &&
                    String(row.professor_id) === String(values.professor_id) &&
                    String(row.disciplina_id) === String(values.disciplina_id) &&
                    (String(row.semestre_letivo || '') === String(values.semestre_letivo || '') ||
                        (!String(row.semestre_letivo || '').trim() && values.semestre_letivo === getSemester()));
            });
            if (duplicate) throw new Error('Este professor já está vinculado a essa disciplina neste semestre.');
        }
        if (route === 'demandas') {
            if (!values.aulas_semanais || values.aulas_semanais < 1) throw new Error('Informe ao menos uma aula por semana.');
            const duplicate = readRecords(spec.key).some(function (row) {
                return String(row.id) !== String(editing && editing.id) &&
                    String(row.turma_id) === String(values.turma_id) &&
                    String(row.disciplina_id) === String(values.disciplina_id) &&
                    semesterMatches(row) && String(row.semestre_letivo || '') === String(values.semestre_letivo || '');
            });
            if (duplicate) throw new Error('Já existe uma demanda dessa disciplina para a turma neste semestre. Edite o registro existente.');
        }
        if (route === 'peculiaridades' || route === 'eventos') {
            values.nome = String(values.nome || '').trim();
            if (!values.nome) throw new Error(route === 'eventos' ? 'Informe o nome do evento.' : 'Informe o nome da proteção.');
            const duplicate = readRecords(spec.key).some(function (row) {
                return String(row.id) !== String(editing && editing.id) &&
                    String(row.nome || '').trim().toLocaleLowerCase('pt-BR') === values.nome.toLocaleLowerCase('pt-BR');
            });
            if (duplicate) throw new Error(route === 'eventos' ? 'Já existe um evento com esse nome.' : 'Já existe uma proteção com esse nome.');
        }
        const records = readRecords(spec.key);
        const oldRecord = editing && editing.route === route ? records.find(function (row) { return String(row.id) === String(editing.id); }) : null;
        const record = Object.assign({}, oldRecord || {}, values);
        if (route === 'disponibilidade' && record.tipo === 'prd') {
            record.horario_id = null;
            record.disponivel = 0;
        }
        if (route === 'professores') delete record.disciplina_ingresso_id;
        if (oldRecord) {
            record.id = oldRecord.id;
            if (route === 'notas') record.created_at = oldRecord.created_at || new Date().toISOString();
        } else {
            record.id = nextId(records);
            if (route === 'notas') record.created_at = new Date().toISOString();
        }
        if (route === 'notas') record.updated_at = new Date().toISOString();
        saveRecords(spec.key, oldRecord ? records.map(function (row) { return String(row.id) === String(record.id) ? record : row; }) : records.concat(record), spec.module);
        editing = null;
        render();
        notify('Registro salvo neste navegador.', 'success');
    }

    function deleteRecord(route, id) {
        const spec = specs[route];
        if (!spec) return;
        const record = findById(spec.key, id);
        if (!record) throw new Error('O registro não foi encontrado.');
        if (route === 'peculiaridades' && readRecords(KEYS.protecoesGrade).some(function (protection) {
            return String(protection.peculiaridade_id) === String(id);
        })) {
            throw new Error('Esta proteção está aplicada a uma ou mais turmas. Remova as marcações na Grade oficial antes de excluí-la.');
        }
        if (route === 'eventos' && readRecords(KEYS.eventosGrade).some(function (event) {
            return String(event.evento_id) === String(id);
        })) {
            throw new Error('Este evento está aplicado a uma ou mais turmas. Remova as marcações na Grade oficial antes de excluí-lo.');
        }
        const label = record.nome || record.titulo || record.dia_semana || 'este registro';
        if (!window.confirm('Excluir ' + label + '? Esta ação não pode ser desfeita sem um backup.')) return;
        saveRecords(spec.key, readRecords(spec.key).filter(function (item) { return String(item.id) !== String(id); }), spec.module);
        if (route === 'cursos') {
            [KEYS.disciplinas, KEYS.turmas].forEach(function (key) {
                const rows = readRecords(key).map(function (item) {
                    return String(item.curso_id) === String(id) ? Object.assign({}, item, { curso_id: null, curso_nome: '' }) : item;
                });
                saveRecords(key, rows, key);
            });
        }
        if (route === 'professores') {
            [KEYS.vinculos, KEYS.disponibilidade].forEach(function (key) {
                saveRecords(key, readRecords(key).filter(function (item) { return String(item.professor_id) !== String(id); }), key);
            });
        }
        if (route === 'disciplinas') {
            [KEYS.vinculos, KEYS.demandas].forEach(function (key) {
                saveRecords(key, readRecords(key).filter(function (item) { return String(item.disciplina_id) !== String(id); }), key);
            });
        }
        if (route === 'turmas') {
            saveRecords(KEYS.demandas, readRecords(KEYS.demandas).filter(function (item) { return String(item.turma_id) !== String(id); }), 'TurmaDisciplina');
            saveRecords(KEYS.protecoesGrade, readRecords(KEYS.protecoesGrade).filter(function (item) { return String(item.turma_id) !== String(id); }), 'ProtecoesGrade');
            saveRecords(KEYS.eventosGrade, readRecords(KEYS.eventosGrade).filter(function (item) { return String(item.turma_id) !== String(id); }), 'EventosGrade');
        }
        if (route === 'horarios') {
            saveRecords(KEYS.disponibilidade, readRecords(KEYS.disponibilidade).filter(function (item) { return String(item.horario_id) !== String(id); }), 'ProfessorDisponibilidade');
            saveRecords(KEYS.protecoesGrade, readRecords(KEYS.protecoesGrade).filter(function (item) { return String(item.horario_id) !== String(id); }), 'ProtecoesGrade');
            saveRecords(KEYS.eventosGrade, readRecords(KEYS.eventosGrade).filter(function (item) { return String(item.horario_id) !== String(id); }), 'EventosGrade');
        }
        editing = null;
        render();
        notify('Registro excluído.', 'success');
    }

    function updateSimulation(transform) {
        const semester = getSemester();
        const state = readSimulation(semester);
        transform(state);
        saveSimulation(semester, state);
        render();
    }

    function exportGradeCsv() {
        const semester = getSemester();
        const state = readSimulation(semester);
        const rows = [['Semestre', 'Tipo', 'Turma', 'Dia', 'Início', 'Fim', 'Disciplina / proteção / evento', 'Professor']];
        const slotMap = {};
        readRecords(KEYS.horarios).forEach(function (slot) { slotMap[String(slot.id)] = slot; });
        (state.assignments || []).forEach(function (item) {
            const slot = slotMap[String(item.horario_id)] || {};
            rows.push([
                semester,
                'Aula',
                nameById(KEYS.turmas, item.turma_id, 'Turma'),
                item.dia_semana || '',
                slot.hora_inicio || item.hora_inicio || '',
                slot.hora_fim || item.hora_fim || '',
                item.disciplina_nome || nameById(KEYS.disciplinas, item.disciplina_id, ''),
                item.professor_nome || nameById(KEYS.professores, item.professor_id, '')
            ]);
        });
        getGradeProtections(semester).forEach(function (protection) {
            const slot = slotMap[String(protection.horario_id)] || {};
            rows.push([
                semester,
                protection.tipo_marcacao === 'evento' ? 'Evento' : 'Peculiaridade',
                nameById(KEYS.turmas, protection.turma_id, 'Turma'),
                protection.dia_semana || '',
                slot.hora_inicio || '',
                slot.hora_fim || '',
                protection.peculiaridade_nome || nameById(KEYS.peculiaridades, protection.peculiaridade_id, 'Protegido'),
                ''
            ]);
        });
        const csv = '\ufeff' + rows.map(function (row) {
            return row.map(function (value) { return '"' + String(value).replace(/"/g, '""') + '"'; }).join(';');
        }).join('\r\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'owltime_grade_' + semester.replace('/', '-') + '.csv';
        link.click();
        URL.revokeObjectURL(url);
    }

    function getIndividualSchedule(type, entityId) {
        const collection = type === 'turma' ? KEYS.turmas : KEYS.professores;
        const entity = findById(collection, entityId);
        if (!entity) throw new Error('Selecione uma turma ou professor válido para exportar.');
        const semester = getSemester();
        const state = readSimulation(semester);
        const slots = readRecords(KEYS.horarios);
        const slotMap = {};
        slots.forEach(function (slot) { slotMap[String(slot.id)] = slot; });
        const assignments = (state.assignments || []).filter(function (assignment) {
            return String(type === 'turma' ? assignment.turma_id : assignment.professor_id) === String(entityId);
        }).slice().sort(function (a, b) {
            const dayA = DAYS.indexOf(String(a.dia_semana || ''));
            const dayB = DAYS.indexOf(String(b.dia_semana || ''));
            if (dayA !== dayB) return dayA - dayB;
            const slotA = slotMap[String(a.horario_id)] || {};
            const slotB = slotMap[String(b.horario_id)] || {};
            return String(slotA.hora_inicio || a.hora_inicio || '').localeCompare(String(slotB.hora_inicio || b.hora_inicio || ''));
        });
        const protections = type === 'turma' ? getGradeProtections(semester).filter(function (protection) {
            return String(protection.turma_id) === String(entityId);
        }) : [];
        return { entity: entity, type: type, semester: semester, assignments: assignments, protections: protections, slots: slotMap };
    }

    function exportIndividualScheduleCsv() {
        const schedule = getIndividualSchedule(pdfExportType, pdfExportId);
        const entityLabel = schedule.type === 'turma' ? 'Turma' : 'Professor';
        const rows = [
            ['Semestre', 'Tipo', 'Nome', 'Dia', 'Início', 'Fim', 'Disciplina / proteção / evento', 'Turma', 'Professor'],
            ...schedule.assignments.map(function (assignment) {
                const slot = schedule.slots[String(assignment.horario_id)] || {};
                return [
                    schedule.semester,
                    'Aula · ' + entityLabel,
                    schedule.entity.nome,
                    assignment.dia_semana || '',
                    slot.hora_inicio || assignment.hora_inicio || '',
                    slot.hora_fim || assignment.hora_fim || '',
                    assignment.disciplina_nome || nameById(KEYS.disciplinas, assignment.disciplina_id, ''),
                    nameById(KEYS.turmas, assignment.turma_id, ''),
                    nameById(KEYS.professores, assignment.professor_id, '')
                ];
            }),
            ...schedule.protections.map(function (protection) {
                const slot = schedule.slots[String(protection.horario_id)] || {};
                return [
                    schedule.semester,
                    protection.tipo_marcacao === 'evento' ? 'Evento' : 'Peculiaridade',
                    schedule.entity.nome,
                    protection.dia_semana || '',
                    slot.hora_inicio || '',
                    slot.hora_fim || '',
                    protection.peculiaridade_nome || nameById(KEYS.peculiaridades, protection.peculiaridade_id, 'Protegido'),
                    schedule.entity.nome,
                    ''
                ];
            })
        ];
        const csv = '\ufeff' + rows.map(function (row) {
            return row.map(function (value) { return '"' + String(value).replace(/"/g, '""') + '"'; }).join(';');
        }).join('\r\n');
        const safeName = String(schedule.entity.nome || entityLabel).normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-zA-Z0-9_-]+/g, '_').replace(/^_+|_+$/g, '') || entityLabel.toLowerCase();
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'owltime_grade_' + schedule.type + '_' + safeName + '_' + schedule.semester.replace('/', '-') + '.csv';
        link.click();
        window.setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
        notify('CSV individual de ' + schedule.entity.nome + ' gerado.', 'success');
    }

    function individualSchedulePdfDocument(schedule) {
        const isClass = schedule.type === 'turma';
        const title = isClass ? 'Grade de horários da turma' : 'Horários do professor';
        const lessons = schedule.assignments;
        const activeDays = DAYS.slice(5).filter(function (day) {
            return lessons.some(function (assignment) { return assignment.dia_semana === day; }) ||
                schedule.protections.some(function (protection) { return protection.dia_semana === day; });
        });
        const days = WEEKDAYS.concat(activeDays);
        const timeRanges = Array.from(new Set(lessons.map(function (assignment) {
            const slot = schedule.slots[String(assignment.horario_id)] || {};
            return (slot.hora_inicio || assignment.hora_inicio || '--:--') + '|' +
                (slot.hora_fim || assignment.hora_fim || '--:--');
        }).concat(schedule.protections.map(function (protection) {
            const slot = schedule.slots[String(protection.horario_id)] || {};
            return (slot.hora_inicio || '--:--') + '|' + (slot.hora_fim || '--:--');
        })))).sort(function (a, b) { return a.localeCompare(b); });
        const body = [[
            { text: 'HORÁRIO', style: 'tableHeader' }
        ].concat(days.map(function (day) { return { text: day.toLocaleUpperCase('pt-BR'), style: 'tableHeader' }; }))];
        timeRanges.forEach(function (range) {
            const times = range.split('|');
            const row = [{ text: times[0] + '\n' + times[1], style: 'timeCell' }];
            days.forEach(function (day) {
                const atSlot = lessons.filter(function (assignment) {
                    const slot = schedule.slots[String(assignment.horario_id)] || {};
                    return assignment.dia_semana === day &&
                        (slot.hora_inicio || assignment.hora_inicio || '--:--') === times[0] &&
                        (slot.hora_fim || assignment.hora_fim || '--:--') === times[1];
                });
                if (!atSlot.length) {
                    const protection = schedule.protections.find(function (item) {
                        const slot = schedule.slots[String(item.horario_id)] || {};
                        return item.dia_semana === day &&
                            (slot.hora_inicio || '--:--') === times[0] &&
                            (slot.hora_fim || '--:--') === times[1];
                    });
                    row.push(protection
                        ? {
                            text: (protection.tipo_marcacao === 'evento' ? 'EVENTO ESCOLAR\n' : 'HORÁRIO PROTEGIDO\n') + (protection.peculiaridade_nome ||
                                nameById(KEYS.peculiaridades, protection.peculiaridade_id, 'Proteção')),
                            style: 'protectionCell'
                        }
                        : { text: '—', color: '#94a3b8', alignment: 'center' });
                    return;
                }
                const stack = [];
                atSlot.forEach(function (assignment, index) {
                    if (index) stack.push({ text: ' ', margin: [0, 3, 0, 3] });
                    stack.push({
                        text: assignment.disciplina_nome || nameById(KEYS.disciplinas, assignment.disciplina_id, 'Disciplina'),
                        bold: true,
                        fontSize: 8,
                        color: '#203b5b'
                    });
                    stack.push({
                        text: isClass
                            ? nameById(KEYS.professores, assignment.professor_id, 'Professor')
                            : nameById(KEYS.turmas, assignment.turma_id, 'Turma'),
                        fontSize: 7,
                        color: '#53677d',
                        margin: [0, 2, 0, 0]
                    });
                });
                const firstAssignment = atSlot[0];
                row.push({
                    stack: stack,
                    fillColor: subjectColor(firstAssignment.disciplina_id),
                    margin: [5, 6, 5, 6]
                });
            });
            body.push(row);
        });
        const content = [
            { text: 'OWLTIME · PLANEJAMENTO ESCOLAR', style: 'eyebrow' },
            { text: title, style: 'title' },
            { text: schedule.entity.nome, style: 'entity' },
            {
                columns: [
                    { text: 'Semestre ' + schedule.semester, style: 'meta' },
                    { text: lessons.length + (lessons.length === 1 ? ' aula' : ' aulas') + ' · ' +
                        schedule.protections.length + (schedule.protections.length === 1 ? ' horário protegido' : ' horários protegidos'),
                        style: 'meta', alignment: 'right' }
                ],
                margin: [0, 0, 0, 18]
            }
        ];
        if (timeRanges.length) {
            content.push({
                table: {
                    headerRows: 1,
                    widths: [54].concat(days.map(function () { return '*'; })),
                    body: body
                },
                layout: {
                    hLineColor: function () { return '#d9e2ec'; },
                    vLineColor: function () { return '#d9e2ec'; },
                    hLineWidth: function (index) { return index === 1 ? 1.2 : .6; },
                    vLineWidth: function () { return .6; },
                    paddingLeft: function () { return 5; },
                    paddingRight: function () { return 5; },
                    paddingTop: function () { return 7; },
                    paddingBottom: function () { return 7; }
                }
            });
        } else {
            content.push({
                text: schedule.protections.length
                    ? 'Não há aulas alocadas. Os horários protegidos estão identificados na grade.'
                    : 'Nenhuma aula alocada para ' + schedule.entity.nome + ' neste semestre.',
                color: '#64748b',
                alignment: 'center',
                margin: [0, 24, 0, 0]
            });
        }
        content.push({
            text: 'Grade gerada em ' + new Date().toLocaleDateString('pt-BR') +
                ' · Confira se esta é a versão atual antes de utilizar.',
            style: 'footer',
            margin: [0, 18, 0, 0]
        });
        return {
            pageSize: 'A4',
            pageOrientation: 'landscape',
            pageMargins: [28, 28, 28, 32],
            content: content,
            defaultStyle: { font: 'Roboto', fontSize: 9, color: '#172b4d' },
            styles: {
                eyebrow: { fontSize: 8, bold: true, color: '#3478b8', characterSpacing: 1.1, margin: [0, 0, 0, 7] },
                title: { fontSize: 21, bold: true, color: '#15335b', margin: [0, 0, 0, 4] },
                entity: { fontSize: 14, bold: true, color: '#355a7d', margin: [0, 0, 0, 6] },
                meta: { fontSize: 9, color: '#64748b' },
                tableHeader: { bold: true, fontSize: 8, color: '#23486f', fillColor: '#edf4fc', alignment: 'center' },
                timeCell: { bold: true, fontSize: 8, color: '#42566e', alignment: 'center' },
                protectionCell: { bold: true, fontSize: 8, color: '#8f2933', fillColor: '#fdeced', alignment: 'center', margin: [5, 6, 5, 6] },
                footer: { fontSize: 8, color: '#718096', alignment: 'right' }
            }
        };
    }

    function getIndividualSchedulePdfBlob(schedule) {
        return createPdfBlob(individualSchedulePdfDocument(schedule));
    }

    function completeSchedulePdfDocument(schedules) {
        if (!schedules.length) throw new Error('Não há turmas ativas para compartilhar.');
        const content = [
            { text: 'OWLTIME · PLANEJAMENTO ESCOLAR', style: 'eyebrow' },
            { text: 'Grade completa das turmas', style: 'title' },
            {
                columns: [
                    { text: 'Semestre ' + schedules[0].semester, style: 'meta' },
                    { text: schedules.length + (schedules.length === 1 ? ' turma' : ' turmas'), style: 'meta', alignment: 'right' }
                ],
                margin: [0, 0, 0, 18]
            }
        ];
        schedules.forEach(function (schedule, index) {
            const individualContent = individualSchedulePdfDocument(schedule).content;
            const sectionHeading = { text: schedule.entity.nome, style: 'entity' };
            if (index) sectionHeading.pageBreak = 'before';
            const sectionItems = [
                sectionHeading,
                {
                    columns: [
                        { text: schedule.entity.periodo || 'Horário semanal', style: 'meta' },
                        {
                            text: schedule.assignments.length +
                                (schedule.assignments.length === 1 ? ' aula na grade' : ' aulas na grade'),
                            style: 'meta',
                            alignment: 'right'
                        }
                    ],
                    margin: [0, 0, 0, 12]
                }
            ];
            sectionItems.push(individualContent[4]);
            if (individualContent[5]) {
                sectionItems.push({
                    text: 'Grade gerada em ' + new Date().toLocaleDateString('pt-BR') +
                        ' · Confira se esta é a versão atual antes de utilizar.',
                    style: 'footer',
                    margin: [0, 12, 0, 0]
                });
            }
            sectionItems.forEach(function (item) { content.push(item); });
        });
        return {
            pageSize: 'A4',
            pageOrientation: 'landscape',
            pageMargins: [28, 28, 28, 32],
            content: content,
            defaultStyle: { font: 'Roboto', fontSize: 9, color: '#172b4d' },
            styles: {
                eyebrow: { fontSize: 8, bold: true, color: '#3478b8', characterSpacing: 1.1, margin: [0, 0, 0, 7] },
                title: { fontSize: 21, bold: true, color: '#15335b', margin: [0, 0, 0, 10] },
                entity: { fontSize: 14, bold: true, color: '#355a7d', margin: [0, 0, 0, 6] },
                meta: { fontSize: 9, color: '#64748b' },
                tableHeader: { bold: true, fontSize: 8, color: '#23486f', fillColor: '#edf4fc', alignment: 'center' },
                timeCell: { bold: true, fontSize: 8, color: '#42566e', alignment: 'center' },
                footer: { fontSize: 8, color: '#718096', alignment: 'right' }
            }
        };
    }

    function createPdfBlob(documentDefinition) {
        if (!window.pdfMake || typeof window.pdfMake.createPdf !== 'function') {
            throw new Error('A biblioteca de PDF não foi carregada. Verifique a conexão e atualize a página.');
        }
        return new Promise(function (resolve, reject) {
            try {
                window.pdfMake.createPdf(documentDefinition).getBlob(resolve);
            } catch (error) {
                reject(error);
            }
        });
    }

    function declarationDateValue(date) {
        return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' +
            String(date.getDate()).padStart(2, '0');
    }

    function getDeclarationAssignments(assignments, semester, substitutions, referenceDate) {
        return assignments.map(function (assignment) {
            let current = Object.assign({}, assignment);
            const visitedTeacherIds = new Set([String(current.professor_id)]);
            while (true) {
                const matchingSubstitutions = substitutions.filter(function (record) {
                    return String(record.semestre_letivo) === semester &&
                        String(record.turma_id) === String(current.turma_id) &&
                        String(record.disciplina_id) === String(current.disciplina_id) &&
                        String(record.professor_original_id) === String(current.professor_id) &&
                        String(record.data_inicio || '') <= referenceDate &&
                        (!record.data_fim || String(record.data_fim) >= referenceDate);
                });
                if (matchingSubstitutions.length > 1) {
                    throw new Error('Há vigências sobrepostas para a mesma turma, disciplina e professor. Corrija os registros antes de gerar a declaração.');
                }
                if (!matchingSubstitutions.length) return current;
                const substitution = matchingSubstitutions[0];
                const replacement = findById(KEYS.professores, substitution.professor_substituto_id);
                if (!replacement) throw new Error('Uma substituição vigente aponta para um professor removido. Corrija ou exclua esse registro antes de gerar a declaração.');
                const replacementId = String(replacement.id);
                if (visitedTeacherIds.has(replacementId)) {
                    throw new Error('As substituições vigentes formam um ciclo de professores. Corrija os registros antes de gerar a declaração.');
                }
                visitedTeacherIds.add(replacementId);
                current = Object.assign({}, current, {
                    professor_id: replacement.id,
                    professor_nome: replacement.nome,
                    substituicao_id: substitution.id
                });
            }
        });
    }

    function buildTeacherDeclarationData(assignments) {
        const teachers = new Map(activeRecords(KEYS.professores, ['ativo']).map(function (teacher) {
            return [String(teacher.id), { teacher: teacher, lessons: new Map() }];
        }));
        assignments.forEach(function (assignment) {
            const teacherId = String(assignment.professor_id || '');
            if (!teacherId) throw new Error('Há uma aula sem professor atribuído. Corrija a grade antes de gerar a declaração.');
            if (!teachers.has(teacherId)) {
                const teacher = findById(KEYS.professores, teacherId) || {
                    id: teacherId,
                    nome: assignment.professor_nome || 'Professor removido',
                    carga_horaria_semanal: null
                };
                teachers.set(teacherId, { teacher: teacher, lessons: new Map() });
            }
            const entry = teachers.get(teacherId);
            const classId = String(assignment.turma_id || '');
            const disciplineId = String(assignment.disciplina_id || '');
            const key = classId + '|' + disciplineId;
            const row = entry.lessons.get(key) || { turma_id: classId, disciplina_id: disciplineId, aulas: 0 };
            row.aulas += 1;
            entry.lessons.set(key, row);
        });
        return Array.from(teachers.values()).map(function (entry) {
            const teacher = entry.teacher;
            const lessons = Array.from(entry.lessons.values()).map(function (row) {
                const turma = findById(KEYS.turmas, row.turma_id);
                return {
                    turma: turma ? turma.nome : 'Turma removida',
                    curso: turma ? (turma.curso_nome || nameById(KEYS.cursos, turma.curso_id, '—')) : '—',
                    disciplina: nameById(KEYS.disciplinas, row.disciplina_id, 'Disciplina removida'),
                    aulas: row.aulas
                };
            }).sort(function (a, b) {
                return a.curso.localeCompare(b.curso, 'pt-BR') ||
                    a.turma.localeCompare(b.turma, 'pt-BR') ||
                    a.disciplina.localeCompare(b.disciplina, 'pt-BR');
            });
            const total = lessons.reduce(function (sum, row) { return sum + row.aulas; }, 0);
            const declaredValue = teacher.carga_horaria_semanal;
            const declared = declaredValue == null || String(declaredValue).trim() === ''
                ? null
                : Number(declaredValue);
            return {
                teacher: teacher,
                lessons: lessons,
                total: total,
                declared: Number.isFinite(declared) ? declared : null,
                difference: Number.isFinite(declared) ? total - declared : null
            };
        }).sort(function (a, b) {
            return String(a.teacher.nome || '').localeCompare(String(b.teacher.nome || ''), 'pt-BR');
        });
    }

    function teacherDeclarationPdfDocument(institution, semester, generatedAt, teachers, substitutions, baseAssignments) {
        const content = [
            { text: institution.toLocaleUpperCase('pt-BR'), style: 'institution' },
            { text: 'DECLARAÇÃO DE DISTRIBUIÇÃO DE CARGA HORÁRIA DOCENTE', style: 'title' },
            {
                columns: [
                    { text: 'Semestre letivo: ' + semester, style: 'meta' },
                    { text: 'Data de geração: ' + generatedAt.toLocaleDateString('pt-BR'), style: 'meta', alignment: 'right' }
                ],
                margin: [0, 0, 0, 10]
            },
            {
                text: 'Relatório de conferência das aulas semanais atribuídas por professor, conforme a grade registrada para o semestre. Os totais consideram as substituições vigentes na data de emissão.',
                style: 'intro',
                margin: [0, 0, 0, 14]
            }
        ];
        teachers.forEach(function (item) {
            const teacher = item.teacher;
            content.push({
                table: {
                    widths: ['*', 'auto'],
                    body: [[
                        { text: teacher.nome || 'Professor', style: 'teacherName' },
                        { text: teacher.matricula ? 'Matrícula: ' + teacher.matricula : 'Matrícula não informada', style: 'meta', alignment: 'right' }
                    ]]
                },
                layout: 'noBorders',
                margin: [0, 6, 0, 4]
            });
            const teacherMeta = [teacher.titulacao, teacher.email].filter(Boolean).join(' · ');
            if (teacherMeta) content.push({ text: teacherMeta, style: 'meta', margin: [0, 0, 0, 5] });
            content.push({
                table: {
                    headerRows: 1,
                    widths: ['*', '*', '*', 70],
                    body: [[
                        { text: 'Turma', style: 'tableHeader' },
                        { text: 'Curso', style: 'tableHeader' },
                        { text: 'Disciplina', style: 'tableHeader' },
                        { text: 'Aulas/semana', style: 'tableHeader' }
                    ]].concat(item.lessons.length ? item.lessons.map(function (row) {
                        return [row.turma, row.curso, row.disciplina, { text: String(row.aulas), alignment: 'center' }];
                    }) : [[{ text: 'Nenhuma aula atribuída na data de emissão.', colSpan: 4, color: '#64748b', italics: true, alignment: 'center' }, {}, {}, {}]])
                },
                layout: {
                    fillColor: function (rowIndex) { return rowIndex === 0 ? '#eaf1f8' : rowIndex % 2 ? '#ffffff' : '#f7f9fc'; },
                    hLineColor: function () { return '#d5dee8'; },
                    vLineColor: function () { return '#d5dee8'; },
                    paddingLeft: function () { return 7; },
                    paddingRight: function () { return 7; },
                    paddingTop: function () { return 5; },
                    paddingBottom: function () { return 5; }
                },
                margin: [0, 0, 0, 6]
            });
            const isCorrect = item.difference === 0;
            const isOverDeclared = item.difference > 0;
            let comparison;
            if (item.declared == null) comparison = 'Carga semanal declarada: não informada no cadastro.';
            else if (isCorrect) comparison = 'CORRETO · ' + item.total + ' aula(s) atribuída(s) de ' + item.declared + ' declarada(s).';
            else if (isOverDeclared) comparison = 'DIVERGÊNCIA · ' + item.total + ' aula(s) atribuída(s) para ' +
                item.declared + ' declarada(s) (excedente de ' + item.difference + ' aula(s)).';
            else comparison = 'AJUSTE NECESSÁRIO · ' + item.total + ' aula(s) atribuída(s) para ' +
                item.declared + ' declarada(s) (faltam ' + Math.abs(item.difference) + ' aula(s)).';
            content.push({
                text: comparison,
                style: item.declared == null ? 'comparisonUnknown' : isCorrect ? 'comparisonCorrect' :
                    isOverDeclared ? 'comparisonMismatch' : 'comparisonAdjustment',
                margin: [0, 0, 0, 10]
            });
        });
        const substitutionItems = substitutions.slice().sort(function (a, b) {
            return String(a.data_inicio || '').localeCompare(String(b.data_inicio || '')) ||
                String(a.id).localeCompare(String(b.id), 'pt-BR', { numeric: true });
        }).map(function (record) {
            const affectedCount = getSubstitutionAffectedAssignments(
                baseAssignments, semester, substitutions, record
            ).length;
            return {
                turma: nameById(KEYS.turmas, record.turma_id, record.turma_nome || 'Turma removida'),
                disciplina: nameById(KEYS.disciplinas, record.disciplina_id, record.disciplina_nome || 'Disciplina removida'),
                titular: nameById(KEYS.professores, record.professor_original_id, record.professor_original_nome || 'Professor removido'),
                substituto: nameById(KEYS.professores, record.professor_substituto_id, record.professor_substituto_nome || 'Professor removido'),
                vigencia: formatSubstitutionDate(record.data_inicio) + ' até ' +
                    (record.data_fim ? formatSubstitutionDate(record.data_fim) : 'sem data final'),
                aulas: affectedCount
            };
        });
        content.push({
            columns: [
                {
                    stack: [
                        { text: 'HISTÓRICO DE ALOCAÇÃO', style: 'substitutionEyebrow' },
                        { text: 'Vigências e substituições', style: 'substitutionTitle' }
                    ]
                },
                {
                    text: substitutionItems.length + (substitutionItems.length === 1 ? ' registro' : ' registros'),
                    style: 'substitutionCount',
                    alignment: 'right',
                    margin: [0, 10, 0, 0]
                }
            ],
            margin: [0, 8, 0, 4]
        });
        content.push({
            text: 'Cada registro representa uma alteração específica de professor, turma e disciplina, sem acumular períodos distintos como carga simultânea.',
            style: 'substitutionIntro',
            margin: [0, 0, 0, 8]
        });
        if (substitutionItems.length) {
            substitutionItems.forEach(function (item, index) {
                content.push({
                    table: {
                        widths: ['*', '*'],
                        body: [
                            [{
                                text: 'SUBSTITUIÇÃO ' + String(index + 1).padStart(2, '0'),
                                style: 'substitutionIndex',
                                colSpan: 2
                            }, {}],
                            [
                                {
                                    stack: [
                                        { text: 'TURMA', style: 'substitutionLabel' },
                                        { text: item.turma, style: 'substitutionContext' }
                                    ]
                                },
                                {
                                    stack: [
                                        { text: 'DISCIPLINA', style: 'substitutionLabel' },
                                        { text: item.disciplina, style: 'substitutionContext' }
                                    ]
                                }
                            ],
                            [
                                {
                                    stack: [
                                        { text: 'PROFESSOR TITULAR', style: 'substitutionLabel' },
                                        { text: item.titular, style: 'substitutionTeacher' }
                                    ],
                                    fillColor: '#f1f5f9'
                                },
                                {
                                    stack: [
                                        { text: 'PROFESSOR SUBSTITUTO', style: 'substitutionLabel' },
                                        { text: item.substituto, style: 'substitutionReplacement' }
                                    ],
                                    fillColor: '#eaf5ee'
                                }
                            ],
                            [
                                {
                                    stack: [
                                        { text: 'PERÍODO DE VIGÊNCIA', style: 'substitutionLabel' },
                                        { text: item.vigencia, style: 'substitutionValue' }
                                    ]
                                },
                                {
                                    stack: [
                                        { text: 'AULAS AFETADAS NA SEMANA', style: 'substitutionLabel' },
                                        item.aulas
                                            ? { text: item.aulas + (item.aulas === 1 ? ' aula/semana' : ' aulas/semana'), style: 'substitutionLessons' }
                                            : { text: 'Sem correspondência na grade', style: 'substitutionNoLessons' }
                                    ]
                                }
                            ]
                        ]
                    },
                    layout: {
                        hLineWidth: function (index) { return index === 0 || index === 4 ? 0 : 0.7; },
                        vLineWidth: function () { return 0; },
                        hLineColor: function () { return '#dbe4ed'; },
                        paddingLeft: function (index) { return index === 0 ? 8 : 10; },
                        paddingRight: function (index) { return index === 0 ? 8 : 10; },
                        paddingTop: function (index) { return index === 0 ? 5 : 6; },
                        paddingBottom: function (index) { return index === 0 ? 4 : 7; }
                    },
                    margin: [0, 0, 0, 10]
                });
            });
        } else {
            content.push({
                text: 'Nenhuma substituição registrada para este semestre.',
                style: 'substitutionEmpty',
                margin: [0, 2, 0, 8]
            });
        }
        content.push({
            text: 'A comparação utiliza aulas semanais (não horas-relógio) e o campo “Carga semanal (aulas)” do cadastro docente. Os totais individuais representam a situação vigente na data de geração; períodos distintos de substituição não são acumulados como carga simultânea.',
            style: 'note',
            margin: [0, 12, 0, 18]
        });
        content.push({
            columns: [
                { text: '__________________________________\nResponsável pela conferência', style: 'signature' },
                { text: '__________________________________\nDireção / Coordenação', style: 'signature', alignment: 'right' }
            ],
            margin: [0, 20, 0, 0]
        });
        return {
            pageSize: 'A4',
            pageOrientation: 'portrait',
            pageMargins: [38, 48, 38, 48],
            content: content,
            defaultStyle: { font: 'Roboto', fontSize: 8.5, color: '#25364a' },
            header: function () {
                return {
                    canvas: [{ type: 'line', x1: 38, y1: 34, x2: 557, y2: 34, lineWidth: 1.5, lineColor: '#1d4e89' }],
                    margin: [0, 0, 0, 0]
                };
            },
            footer: function (currentPage, pageCount) {
                return {
                    columns: [
                        { text: institution + ' · Semestre ' + semester, margin: [38, 0, 0, 0], style: 'footer' },
                        { text: currentPage + ' / ' + pageCount, alignment: 'right', margin: [0, 0, 38, 0], style: 'footer' }
                    ],
                    margin: [0, 18, 0, 0]
                };
            },
            styles: {
                institution: { fontSize: 11, bold: true, color: '#1d4e89', alignment: 'center', characterSpacing: 0.6, margin: [0, 0, 0, 8] },
                title: { fontSize: 15, bold: true, color: '#183653', alignment: 'center', margin: [0, 0, 0, 10] },
                meta: { fontSize: 8, color: '#617286' },
                intro: { fontSize: 8.5, color: '#42556b', alignment: 'justify', lineHeight: 1.2 },
                teacherName: { fontSize: 10, bold: true, color: '#1d4e89' },
                tableHeader: { bold: true, fontSize: 7.5, color: '#23486f', fillColor: '#eaf1f8', alignment: 'center' },
                comparisonCorrect: { bold: true, color: '#176b42', fillColor: '#e8f5ed', fontSize: 8.5, margin: [6, 5, 6, 5] },
                comparisonMismatch: { bold: true, color: '#a33131', fillColor: '#fdecec', fontSize: 8.5, margin: [6, 5, 6, 5] },
                comparisonAdjustment: { bold: true, color: '#765b13', fillColor: '#fff7df', fontSize: 8.5, margin: [6, 5, 6, 5] },
                comparisonUnknown: { bold: true, color: '#765b13', fillColor: '#fff7df', fontSize: 8.5, margin: [6, 5, 6, 5] },
                sectionTitle: { fontSize: 10, bold: true, color: '#1d4e89' },
                substitutionEyebrow: { fontSize: 7, bold: true, color: '#5380a8', characterSpacing: 1.1 },
                substitutionTitle: { fontSize: 11, bold: true, color: '#1d4167', margin: [0, 2, 0, 0] },
                substitutionCount: { fontSize: 7.5, bold: true, color: '#355a7d', fillColor: '#edf4fa', margin: [7, 5, 7, 5] },
                substitutionIntro: { fontSize: 7.5, color: '#617286', lineHeight: 1.15 },
                substitutionIndex: { fontSize: 7, bold: true, color: '#5380a8', characterSpacing: 0.8, fillColor: '#f6f9fc' },
                substitutionLabel: { fontSize: 6.5, bold: true, color: '#75869a', characterSpacing: 0.5, margin: [0, 0, 0, 3] },
                substitutionContext: { fontSize: 8.5, bold: true, color: '#294765' },
                substitutionTeacher: { fontSize: 9, bold: true, color: '#344b63' },
                substitutionReplacement: { fontSize: 9, bold: true, color: '#176b42' },
                substitutionValue: { fontSize: 8, color: '#344b63' },
                substitutionLessons: { fontSize: 8, bold: true, color: '#1d4e89' },
                substitutionNoLessons: { fontSize: 8, color: '#9a6b16', italics: true },
                substitutionEmpty: { fontSize: 8, color: '#617286', fillColor: '#f6f9fc', margin: [8, 7, 8, 7] },
                note: { fontSize: 7.5, color: '#617286', italics: true, alignment: 'justify' },
                signature: { fontSize: 8, color: '#42556b', alignment: 'center', lineHeight: 1.3 },
                footer: { fontSize: 7, color: '#718096' }
            }
        };
    }

    async function downloadTeacherDeclaration() {
        const institution = String(document.getElementById('declaration-institution').value || '').trim();
        if (!institution) throw new Error('Informe o nome da instituição antes de gerar a declaração.');
        const semester = getSemester();
        const generatedAt = new Date();
        const state = readSimulation(semester);
        if (!state.assignments.length) throw new Error('Não há aulas na grade deste semestre para declarar.');
        localStorage.setItem(DECLARATION_INSTITUTION_KEY, institution);
        const substitutions = readRecords(KEYS.substituicoes).filter(function (record) {
            return String(record.semestre_letivo || '') === semester;
        });
        const referenceDate = declarationDateValue(generatedAt);
        const effectiveAssignments = getDeclarationAssignments(state.assignments, semester, substitutions, referenceDate);
        const teachers = buildTeacherDeclarationData(effectiveAssignments);
        const documentDefinition = teacherDeclarationPdfDocument(
            institution, semester, generatedAt, teachers, substitutions, state.assignments
        );
        const blob = await createPdfBlob(documentDefinition);
        const safeInstitution = institution.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-zA-Z0-9_-]+/g, '_').replace(/^_+|_+$/g, '') || 'instituicao';
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'declaracao_carga_horaria_' + safeInstitution + '_' + semester.replace('/', '-') + '.pdf';
        link.click();
        window.setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
        notify('Declaração docente gerada em PDF.', 'success');
    }

    async function getCompleteSchedulePdfBlob() {
        const turmas = activeRecords(KEYS.turmas, ['ativa', 'ativo']);
        if (!turmas.length) throw new Error('Não há turmas ativas para compartilhar.');
        const schedules = turmas.map(function (turma) {
            return getIndividualSchedule('turma', turma.id);
        });
        return createPdfBlob(completeSchedulePdfDocument(schedules));
    }

    function individualSchedulePdfFilename(schedule) {
        const safeName = String(schedule.entity.nome || schedule.type).normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-zA-Z0-9_-]+/g, '_').replace(/^_+|_+$/g, '') || schedule.type;
        return 'owltime_grade_' + schedule.type + '_' + safeName + '_' + schedule.semester.replace('/', '-') + '.pdf';
    }

    async function downloadIndividualSchedulePdf() {
        const schedule = getIndividualSchedule(pdfExportType, pdfExportId);
        const blob = await getIndividualSchedulePdfBlob(schedule);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = individualSchedulePdfFilename(schedule);
        link.click();
        window.setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
        notify('PDF individual de ' + schedule.entity.nome + ' gerado.', 'success');
    }

    async function shareIndividualSchedulePdf() {
        const schedule = getIndividualSchedule(pdfExportType, pdfExportId);
        const blob = await getIndividualSchedulePdfBlob(schedule);
        const file = new File([blob], individualSchedulePdfFilename(schedule), { type: 'application/pdf' });
        const heading = (schedule.type === 'turma' ? 'Grade da turma ' : 'Horários de ') + schedule.entity.nome;
        if (typeof navigator.share === 'function' && typeof navigator.canShare === 'function' &&
            navigator.canShare({ files: [file] })) {
            await navigator.share({
                title: heading + ' · ' + schedule.semester,
                text: 'Segue a grade de horários de ' + schedule.entity.nome + ' para o semestre ' + schedule.semester + '.',
                files: [file]
            });
            notify('PDF compartilhado.', 'success');
            return;
        }
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = file.name;
        link.click();
        window.setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
        notify('Este navegador não oferece compartilhamento direto de arquivos. O PDF foi baixado para você anexá-lo no WhatsApp ou em outro aplicativo.', 'info');
    }

    async function shareCompleteSchedulePdf() {
        const blob = await getCompleteSchedulePdfBlob();
        const file = new File([blob], 'owltime_grade_todas_as_turmas_' + getSemester().replace('/', '-') + '.pdf', {
            type: 'application/pdf'
        });
        const title = 'Grade completa das turmas · ' + getSemester();
        if (typeof navigator.share === 'function' && typeof navigator.canShare === 'function' &&
            navigator.canShare({ files: [file] })) {
            await navigator.share({
                title: title,
                text: 'Segue a grade completa de horários das turmas para o semestre ' + getSemester() + '.',
                files: [file]
            });
            notify('PDF com a grade completa compartilhado.', 'success');
            return;
        }
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = file.name;
        link.click();
        window.setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
        notify('Este navegador não oferece compartilhamento direto de arquivos. O PDF completo foi baixado para você anexá-lo no WhatsApp ou em outro aplicativo.', 'info');
    }

    function shareIndividualSchedule() {
        const schedule = getIndividualSchedule(pdfExportType, pdfExportId);
        const heading = (schedule.type === 'turma' ? 'Grade da turma ' : 'Horários de ') + schedule.entity.nome;
        const lines = schedule.assignments.map(function (assignment) {
            const slot = schedule.slots[String(assignment.horario_id)] || {};
            return (assignment.dia_semana || 'Dia não informado') + ' · ' +
                (slot.hora_inicio || assignment.hora_inicio || '--:--') + '–' +
                (slot.hora_fim || assignment.hora_fim || '--:--') + ' · ' +
                (assignment.disciplina_nome || nameById(KEYS.disciplinas, assignment.disciplina_id, 'Disciplina')) +
                (schedule.type === 'turma'
                    ? ' · ' + nameById(KEYS.professores, assignment.professor_id, 'Professor')
                    : ' · ' + nameById(KEYS.turmas, assignment.turma_id, 'Turma'));
        });
        const text = heading + '\nSemestre ' + schedule.semester + '\n\n' +
            (lines.length ? lines.join('\n') : 'Nenhuma aula alocada neste semestre.') +
            '\n\nGrade compartilhada pelo Owltime. Confirme se esta é a versão atual antes de usar.';
        if (typeof navigator.share === 'function') {
            return navigator.share({ title: heading + ' · ' + schedule.semester, text: text })
                .then(function () { notify('Resumo compartilhado.', 'success'); });
        }
        return copyTutorialValue(text).then(function () {
            notify('Resumo copiado. Compartilhe-o pelo aplicativo desejado.', 'success');
        });
    }

    function printSchedulePdf() {
        const type = pdfExportType;
        const entityId = pdfExportId;
        const allClasses = type === 'turma' && entityId === 'todas';
        const collection = type === 'turma' ? KEYS.turmas : KEYS.professores;
        const entity = allClasses ? null : findById(collection, entityId);
        if (!allClasses && !entity) throw new Error('Selecione uma turma ou professor válido para gerar o PDF.');
        const semester = getSemester();
        const state = readSimulation(semester);
        const slots = readRecords(KEYS.horarios).filter(function (slot) {
            return String(slot.tipo || 'Aula').toLowerCase() === 'aula';
        });
        const entities = allClasses
            ? activeRecords(KEYS.turmas, ['ativa', 'ativo'])
            : [entity];
        if (!entities.length) throw new Error('Não há turmas ativas para incluir no PDF.');
        const sections = entities.map(function (item) {
            const assignments = state.assignments.filter(function (assignment) {
                return type === 'turma'
                    ? String(assignment.turma_id) === String(item.id)
                    : String(assignment.professor_id) === String(item.id);
            });
            const grid = renderWeeklyGrid(
                slots, assignments, type === 'turma' ? item.id : null, false,
                type === 'turma' ? getGradeProtections(semester) : []
            );
            const sectionTitle = type === 'turma' ? item.nome : item.nome;
            return '<section class="pdf-schedule-section"><h2>' + h(sectionTitle) + '</h2>' + grid +
                '<footer class="pdf-footer">' + assignments.length + ' aula(s) na grade</footer></section>';
        }).join('');
        const heading = type === 'turma'
            ? (allClasses ? 'Grades semanais das turmas' : 'Grade semanal da turma')
            : 'Horários do professor';
        const titleName = allClasses ? 'Todas as turmas' : entity.nome;
        const printWindow = window.open('', '_blank');
        if (!printWindow) throw new Error('O navegador bloqueou a janela do PDF. Permita pop-ups para este site e tente novamente.');
        printWindow.addEventListener('load', function () {
            printWindow.focus();
            printWindow.print();
        }, { once: true });
        printWindow.document.open();
        printWindow.document.write('<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>' +
            h(heading + ' - ' + titleName + ' - ' + semester) + '</title><style>' +
            '@page{size:A4 landscape;margin:14mm}*{box-sizing:border-box}body{margin:0;color:#172b4d;font:14px Arial,sans-serif}' +
            '.pdf-header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #1d4e89;padding-bottom:14px;margin-bottom:20px}' +
            '.pdf-brand{font-size:12px;font-weight:700;letter-spacing:.12em;color:#1d4e89;text-transform:uppercase}.pdf-header h1{margin:8px 0 4px;font-size:25px}' +
            '.pdf-header p{margin:0;color:#64748b}.pdf-meta{text-align:right;color:#64748b;font-size:12px;line-height:1.7}.pdf-schedule-section{break-after:page;page-break-after:always}.pdf-schedule-section:last-child{break-after:auto;page-break-after:auto}.pdf-schedule-section h2{margin:0 0 12px;color:#23486f;font-size:20px}.empty-state{padding:24px;color:#64748b;text-align:center}' +
            '.table-responsive{width:100%}.grade-table{width:100%;border-collapse:collapse;table-layout:fixed}.grade-table th,.grade-table td{border:1px solid #cbd5e1;padding:8px;text-align:center;vertical-align:middle}' +
            '.grade-table thead th{background:#edf4fc;color:#23486f;font-size:11px;text-transform:uppercase}.grade-table tbody th{width:70px;background:#f7f9fc;font-size:12px;white-space:nowrap}' +
            '.grade-table td{height:76px}.grade-cell-entries{display:grid;gap:4px}.grade-entry{display:block;width:100%;padding:8px;border:0;border-radius:6px;color:#20436b;background:var(--grade-subject-color,#eaf3fc);font-size:12px;line-height:1.35;text-align:left;break-inside:avoid}.grade-protection-entry{display:grid;gap:3px;padding:8px;border:1px solid #e6a3a8;border-left:4px solid #c74750;border-radius:6px;color:#8f2933;background:#fdeced;font-size:12px;line-height:1.35}.grade-protection-entry small{color:#a34a52;font-size:10px}' +
            '.grade-entry strong{display:block}.grade-entry small{display:block;margin-top:3px;color:#58718e;font-size:10px}.pdf-footer{margin-top:16px;padding-top:8px;border-top:1px solid #dbe3ec;color:#7b8797;font-size:10px;text-align:right}' +
            '</style></head><body><header class="pdf-header"><div><div class="pdf-brand">Owltime · Planejamento escolar</div><h1>' +
            h(heading) + '</h1><p>' + h(titleName) + '</p></div><div class="pdf-meta">Semestre: ' + h(semester) + '<br>Gerado em: ' +
            h(new Date().toLocaleDateString('pt-BR')) + '</div></header>' + sections +
            '<footer class="pdf-footer">Documento gerado pelo Owltime</footer></body></html>');
        printWindow.document.close();
    }

    function applySemesterFrom(inputId) {
        const semester = setSemester(document.getElementById(inputId).value);
        editing = null;
        gradeEditingId = null;
        teacherSubstitutionEditingId = '';
        gradeFocusDay = '';
        gradeFocusSlotId = '';
        render();
        notify('Semestre ' + semester + ' selecionado.', 'success');
    }

    function handleClick(event) {
        const button = event.target.closest('[data-action]');
        if (!button) return;
        const action = button.dataset.action;
        try {
            if (action === 'start-tutorial') {
                saveTutorialState({ step: 0 });
                if (window.location.hash === '#/cursos') render();
                else window.location.hash = '#/cursos';
            } else if (action === 'copy-tutorial-value') {
                copyTutorialValue(button.dataset.copyValue || '').then(function () {
                    notify('Valor copiado. Cole-o no campo correspondente.', 'success');
                }).catch(function (error) {
                    console.error('Falha ao copiar valor do tutorial:', error);
                    notify(error.message || 'Não foi possível copiar o valor.', 'danger');
                });
            } else if (action === 'go-tutorial-step') {
                const state = readTutorialState();
                const route = TUTORIAL_STEPS[state.step].route;
                if (window.location.hash === '#/' + route) render();
                else window.location.hash = '#/' + route;
            } else if (action === 'toggle-tutorial-minimize') {
                const state = readTutorialState();
                if (!state) return;
                state.minimized = !state.minimized;
                saveTutorialState(state);
                render();
            } else if (action === 'next-tutorial-step') {
                const state = readTutorialState();
                if (state.step >= TUTORIAL_STEPS.length - 1) {
                    clearTutorialState();
                    render();
                    notify('Tutorial concluído. Você pode iniciar novamente pela página Ajuda.', 'success');
                } else {
                    state.step += 1;
                    saveTutorialState(state);
                    const route = TUTORIAL_STEPS[state.step].route;
                    if (window.location.hash === '#/' + route) render();
                    else window.location.hash = '#/' + route;
                }
            } else if (action === 'stop-tutorial') {
                clearTutorialState();
                render();
                notify('Tutorial encerrado. Os cadastros feitos permanecem neste navegador.', 'info');
            } else if (action === 'toggle-grade-all-classes') {
                gradeAllClassesCollapsed = !gradeAllClassesCollapsed;
                render();
            } else if (action === 'close-slot-protection') {
                const dialog = document.getElementById('slot-protection-dialog');
                if (dialog && dialog.open) dialog.close();
            } else if (action === 'toggle-sidebar') {
                const sidebar = document.getElementById('main-sidebar');
                const toggle = document.getElementById('sidebar-toggle');
                const collapsed = sidebar.hidden;
                sidebar.hidden = !collapsed;
                document.querySelector('.app-layout').classList.toggle('sidebar-collapsed', !collapsed);
                toggle.setAttribute('aria-expanded', String(collapsed));
                toggle.setAttribute('aria-label', collapsed ? 'Fechar menu' : 'Abrir menu');
                toggle.innerHTML = '<i class="bi ' + (collapsed ? 'bi-x-lg' : 'bi-list') + '" aria-hidden="true"></i>';
            } else if (action === 'export-backup') exportBackup();
            else if (action === 'pick-backup') document.getElementById('backup-file').click();
            else if (action === 'download-catalog-template') {
                const route = window.location.hash.replace(/^#\/?/, '').split('/')[0] || '';
                if (!catalogImportSchemas[route]) throw new Error('Este cadastro não possui modelo de importação.');
                downloadCatalogTemplate(route, button.dataset.format).catch(function (error) {
                    console.error('Falha ao gerar modelo de planilha:', error);
                    notify(error.message || 'Não foi possível gerar o modelo.', 'danger');
                });
            } else if (action === 'download-current-spreadsheet') {
                const route = window.location.hash.replace(/^#\/?/, '').split('/')[0] || '';
                downloadCurrentSpreadsheet(route).catch(function (error) {
                    console.error('Falha ao gerar planilha preenchida:', error);
                    notify(error.message || 'Não foi possível gerar a planilha.', 'danger');
                });
            } else if (action === 'pick-current-spreadsheet') {
                document.getElementById('current-spreadsheet-file').click();
            } else if (action === 'cancel-current-spreadsheet') {
                spreadsheetImport = null;
                render();
            } else if (action === 'confirm-current-spreadsheet') {
                confirmCurrentSpreadsheet();
            } else if (action === 'pick-catalog-import') document.getElementById('catalog-import-file').click();
            else if (action === 'cancel-catalog-import') {
                catalogImport = null;
                render();
            } else if (action === 'confirm-catalog-import') confirmCatalogImport();
            else if (action === 'toggle-demand-classes') {
                const checkboxes = Array.from(document.querySelectorAll('#bulk-demand-form input[name="turma_ids"]'));
                const shouldCheck = checkboxes.some(function (checkbox) { return !checkbox.checked; });
                checkboxes.forEach(function (checkbox) { checkbox.checked = shouldCheck; });
            } else if (action === 'clear-record-filters') {
                document.querySelectorAll('.record-filter-control').forEach(function (control) { control.value = ''; });
                const search = document.getElementById('table-search');
                if (search) search.value = '';
                applyRecordFilters();
            } else if (action === 'note-status') {
                const record = findById(KEYS.notas, button.dataset.id);
                if (!record) throw new Error('A anotação não foi encontrada.');
                const updated = Object.assign({}, record, {
                    status: button.dataset.status,
                    prioridade: record.prioridade || 'media',
                    updated_at: new Date().toISOString()
                });
                saveRecords(KEYS.notas, readRecords(KEYS.notas).map(function (note) {
                    return String(note.id) === String(updated.id) ? updated : note;
                }), specs.notas.module);
                render();
            } else if (action === 'availability-apply') {
                availabilitySemester = setSemester(document.getElementById('availability-semester').value);
                editing = null;
                render();
                notify('Consulta de disponibilidade atualizada para ' + availabilitySemester + '.', 'success');
            } else if (action === 'edit') {
                const route = (window.location.hash.replace(/^#\/?/, '').split('/')[0] || '');
                const record = findById(specs[route].key, button.dataset.id);
                if (!record) throw new Error('O registro não foi encontrado.');
                editing = { route: route, id: record.id, record: record };
                render();
                document.getElementById('field-' + specs[route].fields[0].name).focus();
            } else if (action === 'delete') {
                const route = (window.location.hash.replace(/^#\/?/, '').split('/')[0] || '');
                deleteRecord(route, button.dataset.id);
            } else if (action === 'cancel-edit') {
                editing = null;
                render();
            } else if (action === 'generate-grade') generateGrade();
            else if (action === 'select-slot') {
                gradeEditingId = null;
                gradeFocusDay = button.dataset.day;
                gradeFocusSlotId = button.dataset.slotId;
                updateSimulation(function (state) { state.activeTurmaId = Number(button.dataset.classId || 0); });
                openAssignmentDialog();
            } else if (action === 'edit-assignment') {
                const assignment = readSimulation(getSemester()).assignments.find(function (item) { return String(item.id) === String(button.dataset.id); });
                if (!assignment) throw new Error('A aula não foi encontrada.');
                gradeEditingId = assignment.id;
                gradeFocusDay = '';
                gradeFocusSlotId = '';
                updateSimulation(function (state) { state.activeTurmaId = Number(assignment.turma_id); });
                openAssignmentDialog();
            } else if (action === 'cancel-assignment-edit') {
                const dialog = document.getElementById('manual-assignment-dialog');
                gradeEditingId = null;
                gradeFocusDay = '';
                gradeFocusSlotId = '';
                if (dialog && dialog.open) dialog.close();
                render();
            } else if (action === 'delete-assignment') {
                if (window.confirm('Remover esta aula da grade?')) removeAssignment(button.dataset.id);
            } else if (action === 'edit-teacher-substitution') {
                const substitution = readRecords(KEYS.substituicoes).find(function (record) {
                    return String(record.id) === String(button.dataset.id) &&
                        String(record.semestre_letivo || '') === getSemester();
                });
                if (!substitution) throw new Error('A substituição não foi encontrada para o semestre atual.');
                teacherSubstitutionEditingId = String(substitution.id);
                render();
                document.getElementById('teacher-substitution-form').scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else if (action === 'cancel-teacher-substitution-edit') {
                teacherSubstitutionEditingId = '';
                render();
            } else if (action === 'delete-teacher-substitution') {
                deleteTeacherSubstitution(button.dataset.id);
            } else if (action === 'generate-teacher-declaration') {
                downloadTeacherDeclaration().catch(function (error) {
                    console.error('Falha ao gerar declaração docente:', error);
                    notify(error.message || 'Não foi possível gerar a declaração docente.', 'danger');
                });
            } else if (action === 'clear-grade') {
                if (window.confirm('Limpar todas as aulas e o relatório deste semestre?')) {
                    gradeEditingId = null;
                    gradeFocusDay = '';
                    gradeFocusSlotId = '';
                    saveSimulation(getSemester(), { activeTurmaId: '', assignments: [], lastGenerationReport: null, qdpInfo: null, metodo: null });
                    render();
                    notify('Grade do semestre limpa.', 'success');
                }
            } else if (action === 'export-grade') {
                exportJson('owltime_grade_' + getSemester().replace('/', '-') + '.json', readSimulation(getSemester()));
            } else if (action === 'print') window.print();
            else if (action === 'apply-report-filters') {
                reportSearchQuery = document.getElementById('report-search').value.trim();
                reportCourseFilter = document.getElementById('report-course-filter').value;
                reportTeacherFilter = document.getElementById('report-teacher-filter').value;
                reportTurmaFilter = document.getElementById('report-class-filter').value;
                reportDisciplineFilter = document.getElementById('report-discipline-filter').value;
                reportMinimumLessons = document.getElementById('report-min-lessons').value;
                reportMaximumLessons = document.getElementById('report-max-lessons').value;
                if (reportMinimumLessons !== '' && reportMaximumLessons !== '' &&
                    Number(reportMinimumLessons) > Number(reportMaximumLessons)) {
                    throw new Error('A quantidade mínima de aulas não pode ser maior que a máxima.');
                }
                render();
            } else if (action === 'clear-report-filters') {
                reportSearchQuery = '';
                reportCourseFilter = '';
                reportTeacherFilter = '';
                reportTurmaFilter = '';
                reportDisciplineFilter = '';
                reportMinimumLessons = '';
                reportMaximumLessons = '';
                render();
            }
            else if (action === 'report-apply') {
                setSemester(document.getElementById('report-semester').value);
                render();
            } else if (action === 'export-csv') exportGradeCsv();
            else if (action === 'print-schedule-pdf') printSchedulePdf();
            else if (action === 'export-individual-schedule-csv') exportIndividualScheduleCsv();
            else if (action === 'download-individual-schedule-pdf') {
                downloadIndividualSchedulePdf().catch(function (error) {
                    console.error('Falha ao gerar PDF individual:', error);
                    notify(error.message || 'Não foi possível gerar o PDF individual.', 'danger');
                });
            } else if (action === 'share-individual-schedule-pdf') {
                shareIndividualSchedulePdf().catch(function (error) {
                    if (error && error.name === 'AbortError') return;
                    console.error('Falha ao compartilhar PDF individual:', error);
                    notify(error.message || 'Não foi possível compartilhar o PDF.', 'danger');
                });
            } else if (action === 'share-complete-schedule-pdf') {
                shareCompleteSchedulePdf().catch(function (error) {
                    if (error && error.name === 'AbortError') return;
                    console.error('Falha ao compartilhar PDF completo:', error);
                    notify(error.message || 'Não foi possível compartilhar a grade completa.', 'danger');
                });
            }
            else if (action === 'share-individual-schedule') {
                shareIndividualSchedule().catch(function (error) {
                    if (error && error.name === 'AbortError') return;
                    console.error('Falha ao compartilhar grade individual:', error);
                    notify(error.message || 'Não foi possível compartilhar o resumo.', 'danger');
                });
            } else if (action === 'delete-storage-key') {
                const key = button.dataset.key;
                if (!key || !key.startsWith('owltime_')) throw new Error('Chave inválida.');
                if (window.confirm('Excluir a chave ' + key + '?')) {
                    localStorage.removeItem(key);
                    render();
                    notify('Chave removida.', 'success');
                }
            } else if (action === 'delete-selected-storage') {
                const selected = Array.from(document.querySelectorAll('.storage-check:checked')).map(function (input) { return input.value; });
                if (!selected.length) throw new Error('Selecione pelo menos uma chave.');
                if (window.confirm('Excluir ' + selected.length + ' chave(s) local(is)?')) {
                    selected.forEach(function (key) { if (key.startsWith('owltime_')) localStorage.removeItem(key); });
                    render();
                    notify(selected.length + ' chave(s) removida(s).', 'success');
                }
            } else if (action === 'clear-storage') {
                const keys = [];
                for (let index = 0; index < localStorage.length; index += 1) {
                    const key = localStorage.key(index);
                    if (key && key.startsWith('owltime_')) keys.push(key);
                }
                if (!keys.length) throw new Error('Não há dados Owltime para limpar.');
                if (window.confirm('Excluir permanentemente todas as ' + keys.length + ' chave(s) Owltime deste navegador? Exporte um backup antes, se necessário.')) {
                    keys.forEach(function (key) { localStorage.removeItem(key); });
                    render();
                    notify('Dados locais do Owltime removidos.', 'success');
                }
            } else if (action === 'toggle-storage-checks') {
                const checks = Array.from(document.querySelectorAll('.storage-check'));
                const shouldCheck = checks.some(function (check) { return !check.checked; });
                checks.forEach(function (check) { check.checked = shouldCheck; });
            }
        } catch (error) {
            console.error('Falha ao executar ação:', error);
            notify(error.message || 'A ação não foi concluída.', 'danger');
        }
    }

    function handleSubmit(event) {
        const form = event.target;
        try {
            if (form.id === 'record-form') {
                event.preventDefault();
                submitRecord(form);
            } else if (form.id === 'prd-form') {
                event.preventDefault();
                submitPrd(form);
            } else if (form.id === 'bulk-demand-form') {
                event.preventDefault();
                submitBulkDemand(form);
            } else if (form.id === 'copy-schedule-form') {
                event.preventDefault();
                copySchedule(form);
            } else if (form.id === 'manual-assignment-form') {
                event.preventDefault();
                addManualAssignment(form);
            } else if (form.id === 'teacher-substitution-form') {
                event.preventDefault();
                saveTeacherSubstitution(form);
            } else if (form.id === 'slot-protection-form') {
                event.preventDefault();
                saveSlotProtection(form);
            } else if (form.id === 'semester-form') {
                event.preventDefault();
                applySemesterFrom('semester-input');
            }
        } catch (error) {
            event.preventDefault();
            console.error('Falha ao salvar formulário:', error);
            notify(error.message || 'Os dados não foram salvos.', 'danger');
        }
    }

    function handleChange(event) {
        if (event.target.classList.contains('record-filter-control')) {
            applyRecordFilters();
        } else if (event.target.form && event.target.form.id === 'teacher-substitution-form' &&
            ['substitution-class', 'substitution-discipline', 'substitution-start'].includes(event.target.id)) {
            if (event.target.id === 'substitution-class') {
                event.target.form.elements.namedItem('disciplina_id').value = '';
                event.target.form.elements.namedItem('professor_original_id').value = '';
            } else if (event.target.id === 'substitution-discipline') {
                event.target.form.elements.namedItem('professor_original_id').value = '';
            }
            updateTeacherSubstitutionFields(event.target.form);
        } else if (event.target.id === 'coverage-course') {
            coverageCourseId = event.target.value;
            render();
        } else if (event.target.id === 'availability-course') {
            availabilityCourseId = event.target.value;
            render();
        } else if ((event.target.name === 'tipo' || event.target.name === 'dia_semana') && event.target.form && event.target.form.id === 'record-form' &&
            event.target.form.dataset.route === 'disponibilidade') {
            syncAvailabilityForm(event.target.form);
        } else if (event.target.id === 'current-spreadsheet-file' && event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            const route = window.location.hash.replace(/^#\/?/, '').split('/')[0] || '';
            event.target.value = '';
            if (!specs[route]) {
                notify('Abra uma tela de cadastro compatível antes de importar uma planilha.', 'warning');
                return;
            }
            if (!/\.xlsx$/i.test(file.name)) {
                notify('Selecione um arquivo .xlsx.', 'warning');
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                notify('O arquivo excede o limite de 5 MB.', 'danger');
                return;
            }
            const reader = new FileReader();
            reader.onload = async function () {
                try {
                    if ((window.location.hash.replace(/^#\/?/, '').split('/')[0] || '') !== route) return;
                    await readCurrentSpreadsheet(reader.result, route);
                } catch (error) {
                    console.error('Falha ao validar planilha preenchida:', error);
                    notify(error.message || 'A planilha não pôde ser validada.', 'danger');
                }
            };
            reader.onerror = function () {
                notify('Não foi possível ler o arquivo selecionado.', 'danger');
            };
            reader.readAsArrayBuffer(file);
        } else if (event.target.id === 'catalog-import-file' && event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            const route = window.location.hash.replace(/^#\/?/, '').split('/')[0] || '';
            event.target.value = '';
            if (!catalogImportSchemas[route]) {
                notify('Abra um cadastro compatível antes de importar uma planilha.', 'warning');
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                notify('O arquivo excede o limite de 5 MB.', 'danger');
                return;
            }
            const isXlsx = /\.xlsx$/i.test(file.name);
            if (!isXlsx && !/\.csv$/i.test(file.name)) {
                notify('Selecione um arquivo .csv ou .xlsx.', 'warning');
                return;
            }
            const reader = new FileReader();
            reader.onload = async function () {
                try {
                    if ((window.location.hash.replace(/^#\/?/, '').split('/')[0] || '') !== route) return;
                    const rows = isXlsx
                        ? await catalogXlsxRows(reader.result, catalogImportSchemas[route])
                        : catalogCsvRows(String(reader.result || ''), catalogImportSchemas[route]);
                    prepareCatalogImport(route, file.name, rows);
                } catch (error) {
                    console.error('Falha ao validar planilha:', error);
                    notify(error.message || 'A planilha não pôde ser validada.', 'danger');
                }
            };
            reader.onerror = function () {
                notify('Não foi possível ler o arquivo selecionado.', 'danger');
            };
            if (isXlsx) reader.readAsArrayBuffer(file);
            else reader.readAsText(file, 'UTF-8');
        } else if (event.target.id === 'pdf-export-type') {
            pdfExportType = event.target.value === 'professor' ? 'professor' : 'turma';
            pdfExportId = '';
            render();
        } else if (event.target.id === 'pdf-export-entity') {
            pdfExportId = event.target.value;
            render();
        } else if (event.target.id === 'grade-turma-filter') {
            gradeTurmaFilter = event.target.value;
            render();
        } else if (event.target.id === 'grade-discipline-filter') {
            gradeDisciplineFilter = event.target.value;
            render();
        } else if (event.target.id === 'grade-teacher-filter') {
            gradeTeacherFilter = event.target.value;
            render();
        } else if (event.target.id === 'grade-completion-filter') {
            gradeCompletionFilter = event.target.value;
            render();
        } else if (event.target.id === 'manual-day') {
            const form = event.target.form;
            const slot = document.getElementById('manual-slot');
            const matching = Array.from(slot.options).find(function (option) { return option.dataset.day === event.target.value; });
            if (matching) {
                matching.selected = true;
                gradeFocusDay = event.target.value;
                gradeFocusSlotId = matching.value;
            }
            if (form) renderAssignmentGuidance(form);
        } else if (event.target.id === 'manual-slot') {
            const form = event.target.form;
            const selected = event.target.options[event.target.selectedIndex];
            const day = document.getElementById('manual-day');
            if (selected && selected.dataset.day) {
                day.value = selected.dataset.day;
                gradeFocusDay = selected.dataset.day;
                gradeFocusSlotId = selected.value;
            }
            if (form) renderAssignmentGuidance(form);
        } else if (event.target.id === 'manual-subject') {
            const form = event.target.form;
            const previousTeacher = form.elements.namedItem('professor_id');
            const teacherField = document.getElementById('manual-teacher-field');
            if (teacherField) teacherField.innerHTML = '<label class="form-label">Professor</label>' +
                renderManualTeacherField(
                    event.target.value,
                    previousTeacher ? previousTeacher.value : '',
                    form.dataset.originalDisciplineId === event.target.value ? form.dataset.originalProfessorId : ''
                );
            if (teacherField) sortSelectOptions(teacherField);
            if (form) renderAssignmentGuidance(form);
        } else if (event.target.id === 'manual-teacher') {
            if (event.target.form) renderAssignmentGuidance(event.target.form);
        } else if (event.target.id === 'backup-file' && event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            const reader = new FileReader();
            reader.onload = function () {
                try {
                    restoreBackup(JSON.parse(String(reader.result)));
                } catch (error) {
                    console.error('Falha ao importar backup:', error);
                    notify(error.message || 'O arquivo não pôde ser importado.', 'danger');
                }
                event.target.value = '';
            };
            reader.onerror = function () {
                notify('Não foi possível ler o arquivo selecionado.', 'danger');
                event.target.value = '';
            };
            reader.readAsText(file);
        }
    }

    function handleInput(event) {
        if (event.target.id === 'notes-search') {
            const query = event.target.value.trim().toLocaleLowerCase('pt-BR');
            document.querySelectorAll('.note-card').forEach(function (card) {
                card.hidden = query && !card.dataset.noteSearch.includes(query);
            });
            document.querySelectorAll('.notes-column').forEach(function (column) {
                const cards = Array.from(column.querySelectorAll('.note-card'));
                const visible = cards.filter(function (card) { return !card.hidden; }).length;
                const count = column.querySelector('header > span');
                if (count) count.textContent = String(visible);
            });
            return;
        }

        if (event.target.id === 'table-search' || event.target.classList.contains('record-filter-control')) {
            const route = window.location.hash.replace(/^#\/?/, '').split('/')[0];
            if (specs[route]) {
                applyRecordFilters();
                return;
            }
            const query = event.target.value.trim().toLocaleLowerCase('pt-BR');
            document.querySelectorAll('#view tbody tr').forEach(function (row) {
                row.hidden = query && !row.textContent.toLocaleLowerCase('pt-BR').includes(query);
            });
        }
    }

    function handleDoubleClick(event) {
        if (window.location.hash.replace(/^#\/?/, '').split('/')[0] !== 'grade') return;
        const cell = event.target.closest('td[data-protection-class-id]');
        if (!cell) return;
        try {
            openSlotProtectionDialog(cell);
        } catch (error) {
            console.error('Falha ao abrir proteção do horário:', error);
            notify(error.message || 'Não foi possível abrir a proteção do horário.', 'warning');
        }
    }

    function handleDragStart(event) {
        const assignment = event.target.closest('[data-drag-assignment-id]');
        if (!assignment || window.location.hash.replace(/^#\/?/, '').split('/')[0] !== 'ajustes') return;
        event.dataTransfer.setData('text/plain', assignment.dataset.dragAssignmentId);
        event.dataTransfer.effectAllowed = 'move';
        assignment.classList.add('is-dragging');
    }

    function handleDragEnd(event) {
        const assignment = event.target.closest('[data-drag-assignment-id]');
        if (assignment) assignment.classList.remove('is-dragging');
        document.querySelectorAll('.grade-drop-target').forEach(function (target) { target.classList.remove('grade-drop-target'); });
    }

    function handleDragOver(event) {
        if (window.location.hash.replace(/^#\/?/, '').split('/')[0] !== 'ajustes') return;
        const target = event.target.closest('td[data-drop-class-id]');
        if (!target || !Array.from(event.dataTransfer.types).includes('text/plain')) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        target.classList.add('grade-drop-target');
    }

    function handleDragLeave(event) {
        const target = event.target.closest('td[data-drop-class-id]');
        if (target && !target.contains(event.relatedTarget)) target.classList.remove('grade-drop-target');
    }

    function handleDrop(event) {
        if (window.location.hash.replace(/^#\/?/, '').split('/')[0] !== 'ajustes') return;
        const target = event.target.closest('td[data-drop-class-id]');
        if (!target) return;
        event.preventDefault();
        target.classList.remove('grade-drop-target');
        try {
            moveAssignment(
                event.dataTransfer.getData('text/plain'),
                target.dataset.dropClassId,
                target.dataset.dropDay,
                target.dataset.dropSlotId
            );
        } catch (error) {
            console.error('Falha ao mover aula:', error);
            notify(error.message || 'Não foi possível mover a aula.', 'warning');
        }
    }

    document.addEventListener('click', handleClick);
    document.addEventListener('submit', handleSubmit);
    document.addEventListener('change', handleChange);
    document.addEventListener('input', handleInput);
    document.addEventListener('dblclick', handleDoubleClick);
    document.addEventListener('dragstart', handleDragStart);
    document.addEventListener('dragend', handleDragEnd);
    document.addEventListener('dragover', handleDragOver);
    document.addEventListener('dragleave', handleDragLeave);
    document.addEventListener('drop', handleDrop);
    window.addEventListener('hashchange', function () {
        editing = null;
        catalogImport = null;
        if (window.location.hash.replace(/^#\/?/, '').split('/')[0] === 'disponibilidade') {
            availabilitySemester = getSemester();
        }
        render();
    });
    if (!window.location.hash) window.location.hash = '#/dashboard';
    render();
})();
