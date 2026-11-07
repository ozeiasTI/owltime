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
        notas: 'owltime_notas_v1',
        semestre: 'owltime_semestre_atual'
    };
    const DAYS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];
    const SUBJECT_COLORS = ['#dceeff', '#fce4ec', '#e4f4e8', '#fff0d6', '#ece5ff', '#dff5f3', '#f7e8d8', '#e7eafc', '#f3e5f5', '#e8f0df', '#ffe8dc', '#dcecf2'];
    const view = document.getElementById('view');
    const alertBox = document.getElementById('app-alert');
    let editing = null;
    let gradeEditingId = null;
    let gradeFocusDay = '';
    let gradeFocusSlotId = '';
    let gradeDisciplineFilter = '';
    let gradeTurmaFilter = '';
    let pdfExportType = 'turma';
    let pdfExportId = '';
    let catalogImport = null;
    let alertTimer = 0;
    const catalogImportSchemas = {
        cursos: {
            filename: 'modelo_cursos.csv',
            headers: ['Nome', 'Sigla', 'Status'],
            aliases: { nome: ['nome'], sigla: ['sigla'], status: ['status'] }
        },
        professores: {
            filename: 'modelo_professores.csv',
            headers: ['Nome', 'Matrícula', 'E-mail', 'Telefone', 'Titulação', 'Carga semanal (aulas)', 'Limite de aulas por dia', 'Status'],
            aliases: {
                nome: ['nome'], matricula: ['matricula'], email: ['email', 'e_mail'],
                telefone: ['telefone', 'celular'], titulacao: ['titulacao'],
                carga_horaria_semanal: ['carga_semanal_aulas', 'carga_horaria_semanal', 'carga_semanal'],
                limite_aulas_dia: ['limite_de_aulas_por_dia', 'limite_aulas_dia'], status: ['status']
            }
        },
        disciplinas: {
            filename: 'modelo_disciplinas.csv',
            headers: ['Nome', 'Curso', 'Status'],
            aliases: { nome: ['nome'], curso_nome: ['curso', 'curso_nome', 'nome_do_curso'], status: ['status'] }
        },
        turmas: {
            filename: 'modelo_turmas.csv',
            headers: ['Nome da turma', 'Curso', 'Ano letivo', 'Período/turno', 'Semestre letivo', 'Status'],
            aliases: {
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

    function statusBadge(value) {
        const active = ['ativo', 'ativa', 'sim', 'andamento'].includes(String(value || '').toLowerCase());
        const done = ['concluido', 'concluída', 'concluida'].includes(String(value || '').toLowerCase());
        return '<span class="badge text-bg-' + (done ? 'success' : active ? 'primary' : 'secondary') + '">' + h(value || '—') + '</span>';
    }

    function semesterMatches(record) {
        const value = String(record.semestre_letivo || record.semestre || '').trim();
        return !value || value === getSemester();
    }

    function getDemandsForClass(classId) {
        const relations = readRecords(KEYS.demandas).filter(function (row) {
            return String(row.turma_id) === String(classId) && semesterMatches(row);
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
                { name: 'matricula', label: 'Matrícula' },
                { name: 'email', label: 'E-mail', type: 'email' },
                { name: 'telefone', label: 'Telefone', type: 'tel' },
                { name: 'titulacao', label: 'Titulação' },
                { name: 'carga_horaria_semanal', label: 'Carga semanal (aulas)', type: 'number', min: 0, defaultValue: 40 },
                { name: 'limite_aulas_dia', label: 'Limite de aulas por dia', type: 'number', min: 0, defaultValue: 5 },
                { name: 'status', label: 'Status', type: 'select', defaultValue: 'Ativo', options: [['Ativo', 'Ativo'], ['Inativo', 'Inativo']] }
            ],
            columns: [
                ['nome', 'Nome'], ['matricula', 'Matrícula'], ['telefone', 'Telefone'],
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
                { name: 'periodo', label: 'Período/turno', placeholder: 'Ex.: Matutino' },
                { name: 'semestre_letivo', label: 'Semestre letivo', defaultValue: getSemester(), placeholder: 'AAAA/1' },
                { name: 'status', label: 'Status', type: 'select', defaultValue: 'Ativa', options: [['Ativa', 'Ativa'], ['Inativa', 'Inativa']] }
            ],
            columns: [
                ['nome', 'Turma'], ['curso_nome', 'Curso'], ['periodo', 'Período'],
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
                ['dia_semana', 'Dia'], ['hora_inicio', 'Início'], ['hora_fim', 'Fim'], ['tipo', 'Tipo', statusBadge]
            ]
        },
        vinculos: {
            title: 'Vínculos professor × disciplina', icon: 'bi-link-45deg', key: KEYS.vinculos, module: 'ProfessorDisciplina',
            fields: [
                { name: 'professor_id', label: 'Professor', type: 'select', optionsFrom: 'professores', required: true },
                { name: 'disciplina_id', label: 'Disciplina', type: 'select', optionsFrom: 'disciplinas', required: true },
                { name: 'semestre_letivo', label: 'Semestre letivo', defaultValue: getSemester(), placeholder: 'AAAA/1' }
            ],
            columns: [
                ['professor_id', 'Professor', function (id) { return h(nameById(KEYS.professores, id)); }],
                ['disciplina_id', 'Disciplina', function (id) { return h(nameById(KEYS.disciplinas, id)); }],
                ['semestre_letivo', 'Semestre']
            ]
        },
        disponibilidade: {
            title: 'Disponibilidade dos professores', icon: 'bi-calendar2-check', key: KEYS.disponibilidade, module: 'ProfessorDisponibilidade',
            fields: [
                { name: 'professor_id', label: 'Professor', type: 'select', optionsFrom: 'professores', required: true },
                { name: 'dia_semana', label: 'Dia', type: 'select', required: true, options: DAYS.map(function (day) { return [day, day]; }) },
                { name: 'horario_id', label: 'Horário específico (opcional)', type: 'select', optionsFrom: 'horarios', optional: true },
                { name: 'disponivel', label: 'Disponível', type: 'select', defaultValue: '1', options: [['1', 'Sim'], ['0', 'Não']] },
                { name: 'semestre_letivo', label: 'Semestre letivo', defaultValue: getSemester(), placeholder: 'AAAA/1' }
            ],
            columns: [
                ['professor_id', 'Professor', function (id) { return h(nameById(KEYS.professores, id)); }],
                ['dia_semana', 'Dia'],
                ['horario_id', 'Horário', function (id, row) {
                    if (!id) return 'Dia todo';
                    const slot = findById(KEYS.horarios, id);
                    return h(slot ? slot.hora_inicio + '–' + slot.hora_fim : 'Horário removido');
                }],
                ['disponivel', 'Disponível', function (value) { return statusBadge(Number(value) === 1 ? 'Sim' : 'Não'); }],
                ['semestre_letivo', 'Semestre']
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
                ['disciplina_id', 'Disciplina', function (id) { return h(nameById(KEYS.disciplinas, id)); }],
                ['aulas_semanais', 'Aulas/semana'],
                ['semestre_letivo', 'Semestre']
            ]
        },
        notas: {
            title: 'Bloco de notas', icon: 'bi-journal-text', key: KEYS.notas, module: 'Notas',
            fields: [
                { name: 'titulo', label: 'Título', required: true },
                { name: 'texto', label: 'Nota', type: 'textarea', required: true, rows: 4 },
                { name: 'status', label: 'Coluna', type: 'select', defaultValue: 'standby', options: [['standby', 'Standby'], ['andamento', 'Andamento'], ['concluido', 'Concluído']] },
                { name: 'cor', label: 'Cor', type: 'select', defaultValue: 'azul', options: [['azul', 'Azul'], ['verde', 'Verde'], ['laranja', 'Laranja'], ['rosa', 'Rosa'], ['roxo', 'Roxo'], ['cinza', 'Cinza']] }
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
            lastGenerationCard +
            '<div class="d-flex align-items-center justify-content-between mb-2"><h2 class="h5 mb-0">Acesso rápido</h2><a href="#/ajuda" class="small">Como funciona</a></div>' +
            '<div class="row g-3 mb-4">' + links + '</div>' +
            '<div class="card"><div class="card-header d-flex justify-content-between align-items-center"><span>Notas recentes</span><a class="btn btn-sm btn-outline-primary" href="#/notas">Abrir bloco de notas</a></div>' +
            (recentNotes.length ? '<div class="list-group list-group-flush">' + recentNotes.map(function (note) {
                return '<div class="list-group-item"><div class="d-flex justify-content-between gap-3"><strong>' + h(note.titulo) + '</strong>' + statusBadge(note.status) + '</div><div class="small text-muted mt-1">' + h(String(note.texto || '').slice(0, 220)) + '</div></div>';
            }).join('') + '</div>' : '<div class="empty-state"><i class="bi bi-journal"></i>Nenhuma nota registrada ainda.</div>') + '</div>';
    }

    function fieldOptions(field) {
        if (field.options) return field.options;
        const key = KEYS[field.optionsFrom];
        if (!key) return [];
        return readRecords(key).map(function (record) {
            let label = record.nome || record.dia_semana || ('Registro ' + record.id);
            if (field.optionsFrom === 'horarios') label = record.dia_semana + ' · ' + record.hora_inicio + '–' + record.hora_fim + ' · ' + (record.tipo || 'Aula');
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
                    return '<option value="' + h(option[0]) + '"' + selected + '>' + h(option[1]) + '</option>';
                }).join('') + '</select>';
        } else if (field.type === 'textarea') {
            control = '<textarea class="form-control" id="' + id + '" name="' + h(field.name) + '" rows="' + h(field.rows || 3) + '"' + required + placeholder + '>' + h(current) + '</textarea>';
        } else {
            control = '<input class="form-control" id="' + id + '" name="' + h(field.name) + '" type="' + h(field.type || 'text') + '"' +
                (field.type === 'number' ? ' step="1"' : '') + min + placeholder + required + ' value="' + h(current) + '">';
        }
        return '<div class="col-md-6"><label class="form-label" for="' + id + '">' + h(field.label) + (field.required ? ' *' : '') + '</label>' + control + '</div>';
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

    function catalogCsvRows(text, schema) {
        const delimiters = [';', ',', '\t'];
        const delimiter = delimiters.map(function (candidate) {
            return { value: candidate, columns: parseDelimitedCsv(text, candidate)[0] || [] };
        }).sort(function (a, b) { return b.columns.length - a.columns.length; })[0];
        const rows = parseDelimitedCsv(text, delimiter.value);
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
            return { line: index + 2, fields: fields };
        });
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

    function importCatalogRecord(route, fields) {
        const name = String(fields.nome || '').trim();
        if (!name) throw new Error('O nome é obrigatório.');
        if (route === 'cursos') {
            return { nome: name, sigla: fields.sigla || '', status: importStatus(fields.status, 'Ativo', 'Inativo') };
        }
        if (route === 'professores') {
            if (fields.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) throw new Error('E-mail inválido.');
            return {
                nome: name, matricula: fields.matricula || '', email: fields.email || '',
                telefone: fields.telefone || '', titulacao: fields.titulacao || '',
                carga_horaria_semanal: importInteger(fields.carga_horaria_semanal, 'Carga semanal', 40, 0),
                limite_aulas_dia: importInteger(fields.limite_aulas_dia, 'Limite de aulas por dia', 5, 0),
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
            periodo: fields.periodo || '', semestre_letivo: semester,
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

    function prepareCatalogImport(route, filename, text) {
        const rows = catalogCsvRows(text, catalogImportSchemas[route]);
        const existing = readRecords(specs[route].key);
        const accepted = [];
        const preview = rows.map(function (row) {
            if (row.message) return { line: row.line, status: 'error', message: row.message };
            try {
                const record = importCatalogRecord(route, row.fields);
                const duplicate = catalogDuplicateReason(route, record, existing.concat(accepted));
                if (duplicate) return { line: row.line, record: record, status: 'duplicate', message: duplicate };
                accepted.push(record);
                return { line: row.line, record: record, status: 'valid', message: 'Pronto para importar.' };
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
            sigla: 'Sigla', matricula: 'Matrícula', email: 'E-mail', telefone: 'Telefone',
            titulacao: 'Titulação', carga_horaria_semanal: 'Carga semanal',
            limite_aulas_dia: 'Limite diário', curso_nome: 'Curso', ano_letivo: 'Ano letivo',
            periodo: 'Período', semestre_letivo: 'Semestre', status: 'Status'
        };
        const visibleRows = rows.slice(0, 100).map(function (row) {
            const name = row.record ? row.record.nome : '—';
            const details = row.record ? Object.keys(row.record).filter(function (key) {
                return key !== 'nome';
            }).map(function (key) {
                const value = row.record[key] == null || row.record[key] === '' ? '—' : row.record[key];
                return '<span><strong>' + h(detailLabels[key] || key) + ':</strong> ' + h(value) + '</span>';
            }).join(' · ') : '—';
            const label = row.status === 'valid' ? 'Importável' : row.status === 'duplicate' ? 'Ignorado · duplicado' : 'Erro';
            const badge = row.status === 'valid' ? 'success' : row.status === 'duplicate' ? 'secondary' : 'danger';
            return '<tr><td>' + row.line + '</td><td>' + h(name) + '</td><td><div class="small">' + details + '</div></td><td><span class="badge text-bg-' + badge + '">' + label + '</span></td><td>' + h(row.message) + '</td></tr>';
        }).join('');
        return '<div class="card border-primary mb-4"><div class="card-header d-flex justify-content-between align-items-center gap-2 flex-wrap"><strong>Revisar importação · ' + h(catalogImport.filename) + '</strong>' +
            '<button class="btn btn-sm btn-outline-secondary" type="button" data-action="cancel-catalog-import">Cancelar</button></div><div class="card-body">' +
            '<p class="mb-2"><strong>' + validCount + '</strong> para importar · <strong>' + duplicates + '</strong> duplicado(s) ignorado(s) · <strong>' + errors + '</strong> erro(s).</p>' +
            (rows.length > 100 ? '<p class="small text-muted">Prévia das primeiras 100 de ' + rows.length + ' linhas; todas as linhas foram verificadas.</p>' : '') +
            '<div class="table-responsive mb-3"><table class="table table-sm table-striped align-middle"><thead><tr><th>Linha</th><th>Nome</th><th>Dados</th><th>Resultado</th><th>Detalhe</th></tr></thead><tbody>' + visibleRows + '</tbody></table></div>' +
            '<button class="btn btn-primary" type="button" data-action="confirm-catalog-import"' + (validCount ? '' : ' disabled') + '><i class="bi bi-upload me-1"></i>Importar ' + validCount + ' registro(s)</button>' +
            '<span class="small text-muted ms-2">Os registros existentes não serão substituídos.</span></div></div>';
    }

    function downloadCatalogTemplate(route) {
        const schema = catalogImportSchemas[route];
        const csv = '\uFEFF' + schema.headers.map(function (header) {
            return '"' + header.replace(/"/g, '""') + '"';
        }).join(';') + '\r\n';
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = schema.filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    }

    function confirmCatalogImport() {
        if (!catalogImport || !catalogImport.accepted.length) throw new Error('Não há registros válidos para importar.');
        const spec = specs[catalogImport.route];
        const existing = readRecords(spec.key);
        let id = nextId(existing);
        const additions = catalogImport.accepted.map(function (record) {
            return Object.assign({ id: id++ }, record);
        });
        saveRecords(spec.key, existing.concat(additions), spec.module);
        const count = additions.length;
        catalogImport = null;
        render();
        notify(count + ' registro(s) importado(s) com sucesso.', 'success');
    }

    function renderCrud(route) {
        const spec = specs[route];
        const records = readRecords(spec.key).slice().sort(function (a, b) {
            return String(a.nome || a.titulo || a.dia_semana || '').localeCompare(String(b.nome || b.titulo || b.dia_semana || ''), 'pt-BR');
        });
        const isEditing = editing && editing.route === route;
        const fields = spec.fields.map(function (field) {
            return renderField(field, isEditing ? editing.record[field.name] : undefined);
        }).join('');
        const rows = records.map(function (record) {
            const cells = spec.columns.map(function (column) {
                const value = record[column[0]];
                return '<td>' + (column[2] ? column[2](value, record) : h(value == null || value === '' ? '—' : value)) + '</td>';
            }).join('');
            return '<tr>' + cells + '<td><div class="table-actions">' +
                '<button type="button" class="btn btn-sm btn-outline-primary" data-action="edit" data-id="' + h(record.id) + '" aria-label="Editar"><i class="bi bi-pencil"></i></button>' +
                '<button type="button" class="btn btn-sm btn-outline-danger" data-action="delete" data-id="' + h(record.id) + '" aria-label="Excluir"><i class="bi bi-trash"></i></button>' +
                '</div></td></tr>';
        }).join('');
        const emptyCols = spec.columns.length + 1;
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
        const bulkDemandForm = route === 'demandas' ? renderBulkDemandForm() : '';
        const importTools = catalogImportSchemas[route]
            ? '<div class="card mb-4"><div class="card-header">Importar cadastro por planilha</div><div class="card-body">' +
                '<p class="text-muted">Baixe o modelo CSV, preencha uma linha por registro e envie o arquivo para revisar antes de importar. Os dados permanecem neste navegador.</p>' +
                '<div class="d-flex flex-wrap gap-2"><button class="btn btn-outline-primary" type="button" data-action="download-catalog-template"><i class="bi bi-download me-1"></i>Baixar modelo CSV</button>' +
                '<button class="btn btn-primary" type="button" data-action="pick-catalog-import"><i class="bi bi-upload me-1"></i>Escolher planilha CSV</button>' +
                '<input id="catalog-import-file" class="d-none" type="file" accept=".csv,text/csv"></div>' +
                '<div class="form-text mt-2">Para disciplinas e turmas, informe o nome do curso já cadastrado. Importe cursos primeiro quando necessário.</div></div></div>'
            : '';
        return pageHeader(spec.title, spec.icon, descriptionFor(route)) +
            importTools +
            renderCatalogImport(route) +
            bulkDemandForm +
            '<div class="card mb-4"><div class="card-header">' + (isEditing ? 'Editar registro' : 'Novo registro') + '</div><div class="card-body">' +
            '<form id="record-form" data-route="' + route + '"><div class="row g-3">' + fields + '</div>' +
            '<div class="d-flex gap-2 mt-3"><button class="btn btn-primary" type="submit"><i class="bi bi-save me-1"></i>' + (isEditing ? 'Salvar alterações' : 'Salvar') + '</button>' +
            (isEditing ? '<button class="btn btn-outline-secondary" type="button" data-action="cancel-edit">Cancelar</button>' : '') + '</div></form></div></div>' +
            scheduleCopy +
            '<div class="card"><div class="card-header d-flex align-items-center justify-content-between gap-2 flex-wrap"><strong>Registros (' + records.length + ')</strong>' +
            '<input id="table-search" class="form-control form-control-sm" style="max-width:260px" type="search" placeholder="Filtrar registros" aria-label="Filtrar registros"></div>' +
            '<div class="table-responsive"><table class="table table-hover align-middle mb-0"><thead><tr>' +
            spec.columns.map(function (column) { return '<th>' + h(column[1]) + '</th>'; }).join('') + '<th class="text-end">Ações</th></tr></thead><tbody>' +
            (rows || '<tr><td colspan="' + emptyCols + '"><div class="empty-state"><i class="bi bi-inbox"></i>Nenhum registro. Use o formulário acima para começar.</div></td></tr>') +
            '</tbody></table></div></div>';
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
            vinculos: 'Indique quais disciplinas cada professor pode ministrar.',
            disponibilidade: 'Informe dias disponíveis ou bloqueios em períodos específicos.',
            demandas: 'Defina quantas aulas semanais de cada disciplina cada turma precisa.',
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

    function renderWeeklyGrid(slots, assignments, turmaId, editable) {
        const sorted = slots.slice().sort(function (a, b) {
            return String(a.hora_inicio).localeCompare(String(b.hora_inicio)) || String(a.hora_fim).localeCompare(String(b.hora_fim));
        });
        const rowKeys = Array.from(new Set(sorted.map(function (slot) { return String(slot.hora_inicio) + '|' + String(slot.hora_fim); })));
        const header = '<thead><tr><th>Período</th>' + DAYS.map(function (day) { return '<th>' + h(day) + '</th>'; }).join('') + '</tr></thead>';
        const body = rowKeys.map(function (range) {
            const times = range.split('|');
            const cells = DAYS.map(function (day) {
                const slot = sorted.find(function (item) {
                    return item.dia_semana === day && String(item.hora_inicio) === times[0] && String(item.hora_fim) === times[1];
                });
                if (!slot) return '<td><span class="text-muted">—</span></td>';
                const canDrag = Boolean(editable && turmaId);
                const dropTarget = canDrag
                    ? ' data-drop-class-id="' + h(turmaId) + '" data-drop-day="' + h(day) + '" data-drop-slot-id="' + h(slot.id) + '"'
                    : '';
                const atSlot = assignments.filter(function (item) {
                    return String(item.horario_id) === String(slot.id) && String(item.dia_semana) === day &&
                        (!turmaId || String(item.turma_id) === String(turmaId));
                });
                if (!atSlot.length) {
                    return '<td' + dropTarget + '>' + (editable && turmaId
                        ? '<button class="grade-empty" type="button" data-action="select-slot" data-class-id="' + h(turmaId) + '" data-day="' + h(day) + '" data-slot-id="' + h(slot.id) + '" aria-label="Adicionar aula em ' + h(day) + ' às ' + h(slot.hora_inicio) + '"></button>'
                        : '<span class="text-muted">—</span>') + '</td>';
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
                return '<td' + dropTarget + '><div class="grade-cell-entries">' + entries + '</div></td>';
            }).join('');
            return '<tr><th>' + h(times[0]) + '–' + h(times[1]) + '</th>' + cells + '</tr>';
        }).join('');
        return '<div class="table-responsive"><table class="table table-bordered align-middle grade-table mb-0">' + header + '<tbody>' + body + '</tbody></table></div>';
    }

    function renderClassSchedules(turmas, slots, assignments, editable) {
        if (!turmas.length) return '<div class="empty-state"><i class="bi bi-people"></i>Cadastre turmas ativas para montar as grades.</div>';
        if (!slots.length) return '<div class="empty-state"><i class="bi bi-calendar-x"></i>Cadastre os horários de aula para montar as grades.</div>';
        const cards = turmas.map(function (turma) {
            const turmaAssignments = assignments.filter(function (item) { return String(item.turma_id) === String(turma.id); });
            const demand = getDemandsForClass(turma.id).reduce(function (sum, item) { return sum + item.aulas_semanais; }, 0);
            const pending = Math.max(0, demand - turmaAssignments.length);
            const status = !demand ? '<span class="badge text-bg-secondary">Sem demanda</span>'
                : pending ? '<span class="badge text-bg-warning">' + pending + ' pendente(s)</span>'
                    : turmaAssignments.length > demand ? '<span class="badge text-bg-info">Excedente</span>'
                        : '<span class="badge text-bg-success">Completa</span>';
            return '<section class="card grade-class-card"><div class="card-header d-flex justify-content-between align-items-center gap-2 flex-wrap">' +
                '<strong>' + h(turma.nome) + '</strong><span class="small text-muted">' + turmaAssignments.length + ' / ' + demand + ' aula(s)</span>' + status + '</div>' +
                '<div class="card-body">' + renderWeeklyGrid(slots, turmaAssignments, turma.id, editable) + '</div></section>';
        }).join('');
        return '<div class="grade-class-schedules">' + cards + '</div>';
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
            const available = row.disponivel === true || Number(row.disponivel) === 1 || String(row.disponivel).toLowerCase() === 'sim';
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
            maxAulasDia: Math.max(1, Math.max.apply(null, DAYS.map(function (day) {
                return horarios.filter(function (slot) { return slot.dia_semana === day; }).length;
            })))
        };
    }

    function generateGrade() {
        if (typeof QDPEngine !== 'function') throw new Error('O mecanismo QDP não foi carregado. Atualize a página e tente novamente.');
        const semester = getSemester();
        const state = readSimulation(semester);
        if (state.assignments.length && !window.confirm('Gerar novamente pelo QDP substituirá a grade atual deste semestre. Deseja continuar?')) return;
        const config = getQdpConfig();
        const demandCount = Object.values(config.demandaPorTurma).reduce(function (sum, rows) {
            return sum + rows.reduce(function (part, row) { return part + row.aulas_previstas; }, 0);
        }, 0);
        if (!config.turmas.length || !config.professores.length || !config.horarios.length || !demandCount) {
            throw new Error('Antes de gerar, cadastre turmas, professores, horários e demandas semanais.');
        }
        if (!Object.keys(config.vinculos).length) throw new Error('Vincule professores às disciplinas antes de gerar a grade.');
        const engine = new QDPEngine(config);
        const result = engine.gerarGradeCompleta();
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
            logs: result.logs || []
        };
        state.qdpInfo = { geradoEm: new Date().toISOString(), tempo: result.tempo, completo: Boolean(result.completo) };
        state.metodo = 'QDP';
        saveSimulation(semester, state);
        render();
        notify('Grade QDP gerada e salva neste navegador.', 'success');
    }

    function renderGrade(manualAdjustments) {
        const semester = getSemester();
        const state = readSimulation(semester);
        const editable = Boolean(manualAdjustments);
        const turmas = activeRecords(KEYS.turmas, ['ativa', 'ativo']);
        const slots = readRecords(KEYS.horarios).filter(function (slot) { return String(slot.tipo || 'Aula').toLowerCase() === 'aula'; });
        const assignments = state.assignments || [];
        const disciplines = readRecords(KEYS.disciplinas);
        if (gradeTurmaFilter && !turmas.some(function (turma) { return String(turma.id) === String(gradeTurmaFilter); })) gradeTurmaFilter = '';
        if (gradeDisciplineFilter && !disciplines.some(function (discipline) { return String(discipline.id) === String(gradeDisciplineFilter); })) gradeDisciplineFilter = '';
        const selectedTurma = turmas.find(function (turma) { return String(turma.id) === String(gradeTurmaFilter); }) ||
            turmas.find(function (turma) { return String(turma.id) === String(state.activeTurmaId); }) || turmas[0];
        const semesterForm = '<form id="semester-form" class="d-flex align-items-end gap-2"><div><label class="form-label mb-1" for="semester-input">Semestre</label>' +
            '<input id="semester-input" class="form-control form-control-sm" value="' + h(semester) + '" pattern="\\d{4}/[12]" placeholder="AAAA/1" required></div>' +
            '<button class="btn btn-sm btn-outline-primary" type="submit">Aplicar</button></form>';
        const pdfRecords = pdfExportType === 'turma'
            ? activeRecords(KEYS.turmas, ['ativa', 'ativo'])
            : activeRecords(KEYS.professores, ['ativo']);
        if (pdfExportId && !pdfRecords.some(function (item) { return String(item.id) === String(pdfExportId); })) pdfExportId = '';
        if (!pdfExportId && pdfRecords.length) pdfExportId = String(pdfRecords[0].id);
        const pdfExportControls = !editable
            ? '<div class="d-flex flex-wrap align-items-end gap-2 no-print"><div><label class="form-label mb-1" for="pdf-export-type">PDF por</label><select class="form-select form-select-sm" id="pdf-export-type"><option value="turma"' + (pdfExportType === 'turma' ? ' selected' : '') + '>Turma</option><option value="professor"' + (pdfExportType === 'professor' ? ' selected' : '') + '>Professor</option></select></div>' +
                '<div><label class="form-label mb-1" for="pdf-export-entity">' + (pdfExportType === 'turma' ? 'Turma' : 'Professor') + '</label><select class="form-select form-select-sm" id="pdf-export-entity">' +
                (pdfRecords.length ? pdfRecords.map(function (item) {
                    return '<option value="' + h(item.id) + '"' + (String(item.id) === pdfExportId ? ' selected' : '') + '>' + h(item.nome) + '</option>';
                }).join('') : '<option value="">Nenhum registro cadastrado</option>') + '</select></div>' +
                '<button class="btn btn-sm btn-outline-primary" type="button" data-action="print-schedule-pdf"' + (pdfRecords.length ? '' : ' disabled') + '><i class="bi bi-file-earmark-pdf me-1"></i>Gerar PDF</button></div>'
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
        const legend = '<div class="grade-discipline-legend">' + disciplines.map(function (discipline) {
            return '<span class="grade-discipline-chip"><i style="--grade-subject-color:' + subjectColor(discipline.id) + '"></i>' + h(discipline.nome) + '</span>';
        }).join('') + '</div>';
        const selectedFilterTurma = turmas.find(function (turma) { return String(turma.id) === String(gradeTurmaFilter); });
        const scheduleView = gradeDisciplineFilter
            ? '<div class="card mb-3"><div class="card-header d-flex justify-content-between align-items-center gap-2 flex-wrap"><strong>Disciplina por professor</strong>' +
                '<span class="text-muted small">' + h(nameById(KEYS.disciplinas, gradeDisciplineFilter, 'Disciplina')) +
                (selectedFilterTurma ? ' · ' + h(selectedFilterTurma.nome) : ' · todas as turmas') + (editable ? ' · clique em uma aula para editar' : '') + '</span></div><div class="card-body">' +
                renderDisciplineTeacherSchedules(slots, assignments, gradeDisciplineFilter, gradeTurmaFilter, readRecords(KEYS.professores), editable) + '</div></div>'
            : '<div class="mb-2"><strong>' + (selectedFilterTurma ? 'Grade da turma ' + h(selectedFilterTurma.nome) : 'Grade de todas as turmas') +
                '</strong><span class="text-muted small ms-2">' + (editable ? 'Arraste aulas para horários vazios, clique em uma aula para editar ou em um horário vazio para adicionar.' : 'Visualização consolidada das aulas geradas.') + '</span></div>' +
                renderClassSchedules(selectedFilterTurma ? [selectedFilterTurma] : turmas, slots, assignments, editable);
        const gradeEditing = state.assignments.find(function (item) { return String(item.id) === String(gradeEditingId); }) || null;
        const manual = editable ? renderManualAssignment(selectedTurma, slots, gradeEditing, gradeFocusDay, gradeFocusSlotId) : '';
        const workload = renderTeacherWorkload(readRecords(KEYS.professores), assignments);
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
            '<div class="card mb-3"><div class="card-body d-flex align-items-end justify-content-between flex-wrap gap-3">' + turmaFilter + disciplineFilter + legend + '</div></div>' +
            scheduleView + workload + manual +
            '<p class="small text-muted mt-3"><i class="bi bi-info-circle me-1"></i>' + (editable
                ? 'As alterações manuais são gravadas neste navegador. Confira as orientações de demanda e disponibilidade no formulário de cada aula.'
                : 'Use os ajustes manuais em uma tela separada para corrigir ou complementar a grade automática.') + '</p>';
    }

    function getTeacherAvailability(professorId, day, slotId) {
        const records = readRecords(KEYS.disponibilidade).filter(function (row) {
            return String(row.professor_id) === String(professorId) && semesterMatches(row) && row.dia_semana === day;
        });
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
            if (key !== 'owltime_fixture_profile_id' && key !== KEYS.semestre) {
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
            let moduleName = ['owltime_fixture_profile_id', KEYS.semestre].includes(key) ? 'Preferências locais' : 'Configuração';
            if (!['owltime_fixture_profile_id', KEYS.semestre].includes(key)) {
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
        const lastReportSummary = lastReport && lastReport.resumo ? lastReport.resumo : lastReport;
        const assignments = state.assignments || [];
        const byTeacher = {};
        const byClass = {};
        assignments.forEach(function (item) {
            const teacher = item.professor_nome || nameById(KEYS.professores, item.professor_id, 'Sem professor');
            const turma = nameById(KEYS.turmas, item.turma_id, 'Turma removida');
            byTeacher[teacher] = (byTeacher[teacher] || 0) + 1;
            byClass[turma] = (byClass[turma] || 0) + 1;
        });
        function reportRows(map) {
            return Object.keys(map).sort(function (a, b) { return a.localeCompare(b, 'pt-BR'); }).map(function (name) {
                return '<tr><td>' + h(name) + '</td><td class="text-end">' + map[name] + '</td></tr>';
            }).join('');
        }
        return pageHeader('Relatórios', 'bi-bar-chart', 'Consulte a grade por turma ou professor e imprima ou exporte os resultados.') +
            '<div class="card mb-3"><div class="card-body d-flex flex-wrap align-items-end gap-3"><div><label class="form-label" for="report-semester">Semestre</label><input class="form-control" id="report-semester" value="' + h(semester) + '" pattern="\\d{4}/[12]"></div>' +
            '<button class="btn btn-outline-primary" type="button" data-action="report-apply">Aplicar</button><button class="btn btn-outline-secondary" type="button" data-action="print">Imprimir</button>' +
            '<button class="btn btn-outline-success" type="button" data-action="export-csv">Exportar grade CSV</button></div></div>' +
            '<div class="row g-3"><div class="col-lg-6"><div class="card"><div class="card-header">Aulas por turma</div><div class="table-responsive"><table class="table mb-0"><thead><tr><th>Turma</th><th class="text-end">Aulas</th></tr></thead><tbody>' +
            (reportRows(byClass) || '<tr><td colspan="2" class="text-center text-muted py-4">Sem aulas neste semestre.</td></tr>') + '</tbody></table></div></div></div>' +
            '<div class="col-lg-6"><div class="card"><div class="card-header">Aulas por professor</div><div class="table-responsive"><table class="table mb-0"><thead><tr><th>Professor</th><th class="text-end">Aulas</th></tr></thead><tbody>' +
            (reportRows(byTeacher) || '<tr><td colspan="2" class="text-center text-muted py-4">Sem aulas neste semestre.</td></tr>') + '</tbody></table></div></div></div></div>' +
            '<div class="card mt-3"><div class="card-header">Resultado da última geração automática</div><div class="card-body">' +
            (lastReport ? '<p class="mb-1">Gerada em ' + h(formatDate(lastReport.geradoEm || lastReport.generatedAt)) + '</p><p class="mb-0">Aulas pendentes: <strong>' + h(lastReportSummary.totalPendentes || 0) + '</strong></p>' :
                '<span class="text-muted">Ainda não há relatório QDP salvo para este semestre.</span>') + '</div></div>';
    }

    function renderHelp() {
        return pageHeader('Ajuda e privacidade', 'bi-question-circle', 'O que significa operar o Owltime totalmente no navegador?') +
            '<div class="row g-3"><div class="col-lg-7"><div class="card"><div class="card-header">Como seus dados funcionam</div><div class="card-body">' +
            '<ul class="mb-0"><li class="mb-2">Cadastros, vínculos, demandas, notas e grades são salvos no <code>localStorage</code> deste navegador.</li>' +
            '<li class="mb-2">Os dados não são sincronizados entre computadores e não podem ser recuperados pelo administrador do site.</li>' +
            '<li class="mb-2">Use <strong>Armazenamento e backup → Exportar backup</strong> para baixar uma cópia e importe o arquivo para restaurá-la.</li>' +
            '<li>Se limpar os dados do navegador ou trocar de perfil/dispositivo, importe um backup para recuperar o trabalho.</li></ul></div></div></div>' +
            '<div class="col-lg-5"><div class="card"><div class="card-header">Limites importantes</div><div class="card-body"><div class="alert danger-callout mb-0">' +
            'Sem servidor, login e senhas não oferecem autenticação segura. Qualquer pessoa com acesso ao mesmo perfil do navegador pode abrir e alterar os dados. Não use este app para guardar informações que exijam controle de acesso ou sigilo.' +
            '</div></div></div></div><div class="col-12"><div class="card"><div class="card-header">Gerar e ajustar a grade</div><div class="card-body">' +
            '<ol class="mb-0"><li>Cadastre os horários da escola, turmas, disciplinas e professores, além das demandas, vínculos e disponibilidades.</li><li>Em <strong>Grade oficial</strong>, gere a proposta automática usando o QDP.</li>' +
            '<li>Para corrigir ou complementar a proposta, abra <strong>Ajustes manuais</strong>, clique em um horário vazio ou em uma aula existente e use o formulário.</li><li>Confira as demandas restantes e a disponibilidade/carga do professor. Os avisos são orientativos; conflitos podem ser confirmados manualmente.</li></ol></div></div></div></div>';
    }

    function render() {
        const route = (window.location.hash.replace(/^#\/?/, '').split('/')[0] || 'dashboard');
        if (route !== 'grade' && route !== 'ajustes') {
            gradeEditingId = null;
            gradeFocusDay = '';
            gradeFocusSlotId = '';
        }
        document.querySelectorAll('.side-link').forEach(function (link) {
            link.classList.toggle('active', link.dataset.route === route);
        });
        try {
            editing = editing && editing.route === route ? editing : null;
            if (specs[route]) view.innerHTML = renderCrud(route);
            else if (route === 'dashboard') view.innerHTML = renderDashboard();
            else if (route === 'grade') view.innerHTML = renderGrade();
            else if (route === 'ajustes') view.innerHTML = renderGrade(true);
            else if (route === 'relatorios') view.innerHTML = renderReports();
            else if (route === 'armazenamento') view.innerHTML = renderStorage();
            else if (route === 'ajuda') view.innerHTML = renderHelp();
            else view.innerHTML = '<div class="empty-state"><i class="bi bi-exclamation-circle"></i>Página não encontrada.</div>';
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
        if (route === 'vinculos') {
            const duplicate = readRecords(spec.key).some(function (row) {
                return String(row.id) !== String(editing && editing.id) &&
                    String(row.professor_id) === String(values.professor_id) &&
                    String(row.disciplina_id) === String(values.disciplina_id) &&
                    String(row.semestre_letivo || '') === String(values.semestre_letivo || '');
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
        const records = readRecords(spec.key);
        const oldRecord = editing && editing.route === route ? records.find(function (row) { return String(row.id) === String(editing.id); }) : null;
        const record = Object.assign({}, oldRecord || {}, values);
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
        }
        if (route === 'horarios') {
            saveRecords(KEYS.disponibilidade, readRecords(KEYS.disponibilidade).filter(function (item) { return String(item.horario_id) !== String(id); }), 'ProfessorDisponibilidade');
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
        const rows = [['Semestre', 'Turma', 'Dia', 'Início', 'Fim', 'Disciplina', 'Professor']];
        const slotMap = {};
        readRecords(KEYS.horarios).forEach(function (slot) { slotMap[String(slot.id)] = slot; });
        (state.assignments || []).forEach(function (item) {
            const slot = slotMap[String(item.horario_id)] || {};
            rows.push([
                semester,
                nameById(KEYS.turmas, item.turma_id, 'Turma'),
                item.dia_semana || '',
                slot.hora_inicio || item.hora_inicio || '',
                slot.hora_fim || item.hora_fim || '',
                item.disciplina_nome || nameById(KEYS.disciplinas, item.disciplina_id, ''),
                item.professor_nome || nameById(KEYS.professores, item.professor_id, '')
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

    function printSchedulePdf() {
        const type = pdfExportType;
        const entityId = pdfExportId;
        const collection = type === 'turma' ? KEYS.turmas : KEYS.professores;
        const entity = findById(collection, entityId);
        if (!entity) throw new Error('Selecione uma turma ou professor válido para gerar o PDF.');
        const semester = getSemester();
        const state = readSimulation(semester);
        const slots = readRecords(KEYS.horarios).filter(function (slot) {
            return String(slot.tipo || 'Aula').toLowerCase() === 'aula';
        });
        const assignments = state.assignments.filter(function (item) {
            return type === 'turma'
                ? String(item.turma_id) === String(entityId)
                : String(item.professor_id) === String(entityId);
        });
        const grid = renderWeeklyGrid(slots, assignments, type === 'turma' ? entityId : null, false);
        const heading = type === 'turma' ? 'Grade semanal da turma' : 'Horários do professor';
        const printWindow = window.open('', '_blank');
        if (!printWindow) throw new Error('O navegador bloqueou a janela do PDF. Permita pop-ups para este site e tente novamente.');
        printWindow.addEventListener('load', function () {
            printWindow.focus();
            printWindow.print();
        }, { once: true });
        printWindow.document.open();
        printWindow.document.write('<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>' +
            h(heading + ' - ' + entity.nome + ' - ' + semester) + '</title><style>' +
            '@page{size:A4 landscape;margin:14mm}*{box-sizing:border-box}body{margin:0;color:#172b4d;font:14px Arial,sans-serif}' +
            '.pdf-header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #1d4e89;padding-bottom:14px;margin-bottom:20px}' +
            '.pdf-brand{font-size:12px;font-weight:700;letter-spacing:.12em;color:#1d4e89;text-transform:uppercase}.pdf-header h1{margin:8px 0 4px;font-size:25px}' +
            '.pdf-header p{margin:0;color:#64748b}.pdf-meta{text-align:right;color:#64748b;font-size:12px;line-height:1.7}' +
            '.table-responsive{width:100%}.grade-table{width:100%;border-collapse:collapse;table-layout:fixed}.grade-table th,.grade-table td{border:1px solid #cbd5e1;padding:8px;text-align:center;vertical-align:middle}' +
            '.grade-table thead th{background:#edf4fc;color:#23486f;font-size:11px;text-transform:uppercase}.grade-table tbody th{width:70px;background:#f7f9fc;font-size:12px;white-space:nowrap}' +
            '.grade-table td{height:76px}.grade-cell-entries{display:grid;gap:4px}.grade-entry{display:block;width:100%;padding:8px;border:0;border-radius:6px;color:#20436b;background:var(--grade-subject-color,#eaf3fc);font-size:12px;line-height:1.35;text-align:left;break-inside:avoid}' +
            '.grade-entry strong{display:block}.grade-entry small{display:block;margin-top:3px;color:#58718e;font-size:10px}.pdf-footer{margin-top:16px;padding-top:8px;border-top:1px solid #dbe3ec;color:#7b8797;font-size:10px;text-align:right}' +
            '</style></head><body><header class="pdf-header"><div><div class="pdf-brand">Owltime · Planejamento escolar</div><h1>' +
            h(heading) + '</h1><p>' + h(entity.nome) + '</p></div><div class="pdf-meta">Semestre: ' + h(semester) + '<br>Gerado em: ' +
            h(new Date().toLocaleDateString('pt-BR')) + '</div></header>' + grid +
            '<footer class="pdf-footer">Documento gerado pelo Owltime · ' + assignments.length + ' aula(s) na grade</footer></body></html>');
        printWindow.document.close();
    }

    function applySemesterFrom(inputId) {
        const semester = setSemester(document.getElementById(inputId).value);
        editing = null;
        gradeEditingId = null;
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
            if (action === 'toggle-sidebar') {
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
                downloadCatalogTemplate(route);
            } else if (action === 'pick-catalog-import') document.getElementById('catalog-import-file').click();
            else if (action === 'cancel-catalog-import') {
                catalogImport = null;
                render();
            } else if (action === 'confirm-catalog-import') confirmCatalogImport();
            else if (action === 'toggle-demand-classes') {
                const checkboxes = Array.from(document.querySelectorAll('#bulk-demand-form input[name="turma_ids"]'));
                const shouldCheck = checkboxes.some(function (checkbox) { return !checkbox.checked; });
                checkboxes.forEach(function (checkbox) { checkbox.checked = shouldCheck; });
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
            else if (action === 'report-apply') {
                setSemester(document.getElementById('report-semester').value);
                render();
            } else if (action === 'export-csv') exportGradeCsv();
            else if (action === 'print-schedule-pdf') printSchedulePdf();
            else if (action === 'delete-storage-key') {
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
            } else if (form.id === 'bulk-demand-form') {
                event.preventDefault();
                submitBulkDemand(form);
            } else if (form.id === 'copy-schedule-form') {
                event.preventDefault();
                copySchedule(form);
            } else if (form.id === 'manual-assignment-form') {
                event.preventDefault();
                addManualAssignment(form);
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
        if (event.target.id === 'catalog-import-file' && event.target.files && event.target.files[0]) {
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
            const reader = new FileReader();
            reader.onload = function () {
                try {
                    if ((window.location.hash.replace(/^#\/?/, '').split('/')[0] || '') !== route) return;
                    prepareCatalogImport(route, file.name, String(reader.result || ''));
                } catch (error) {
                    console.error('Falha ao validar planilha:', error);
                    notify(error.message || 'A planilha não pôde ser validada.', 'danger');
                }
            };
            reader.onerror = function () {
                notify('Não foi possível ler o arquivo selecionado.', 'danger');
            };
            reader.readAsText(file, 'UTF-8');
        } else if (event.target.id === 'pdf-export-type') {
            pdfExportType = event.target.value === 'professor' ? 'professor' : 'turma';
            pdfExportId = '';
            render();
        } else if (event.target.id === 'pdf-export-entity') {
            pdfExportId = event.target.value;
        } else if (event.target.id === 'grade-turma-filter') {
            gradeTurmaFilter = event.target.value;
            render();
        } else if (event.target.id === 'grade-discipline-filter') {
            gradeDisciplineFilter = event.target.value;
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
        if (event.target.id === 'table-search') {
            const query = event.target.value.trim().toLocaleLowerCase('pt-BR');
            document.querySelectorAll('#view tbody tr').forEach(function (row) {
                row.hidden = query && !row.textContent.toLocaleLowerCase('pt-BR').includes(query);
            });
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
    document.addEventListener('dragstart', handleDragStart);
    document.addEventListener('dragend', handleDragEnd);
    document.addEventListener('dragover', handleDragOver);
    document.addEventListener('dragleave', handleDragLeave);
    document.addEventListener('drop', handleDrop);
    window.addEventListener('hashchange', function () {
        editing = null;
        catalogImport = null;
        render();
    });
    if (!window.location.hash) window.location.hash = '#/dashboard';
    render();
})();
