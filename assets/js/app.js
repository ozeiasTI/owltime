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
    const view = document.getElementById('view');
    const alertBox = document.getElementById('app-alert');
    let editing = null;
    let alertTimer = 0;

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
        studio: ['Studio de análise', 'bi-bezier2'],
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
        return pageHeader('Painel', 'bi-grid-1x2', 'Organize dados escolares e monte grades com armazenamento local.', '<span class="badge text-bg-primary align-self-center">Semestre ' + h(getSemester()) + '</span>') +
            '<div class="alert local-callout"><i class="bi bi-shield-check me-2"></i>Sem conta e sem servidor: seus registros ficam no armazenamento deste navegador. Faça backups periódicos em Armazenamento e backup.</div>' +
            '<div class="row g-3 mb-4">' + stats + '</div>' +
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
        return pageHeader(spec.title, spec.icon, descriptionFor(route)) +
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

    function renderGrade() {
        const semester = getSemester();
        const state = readSimulation(semester);
        const turmas = activeRecords(KEYS.turmas, ['ativa', 'ativo']);
        const selectedId = String(state.activeTurmaId || (turmas[0] && turmas[0].id) || '');
        const selectedTurma = turmas.find(function (turma) { return String(turma.id) === selectedId; }) || turmas[0];
        const slots = readRecords(KEYS.horarios).filter(function (slot) { return String(slot.tipo || 'Aula').toLowerCase() === 'aula'; });
        const assignments = state.assignments || [];
        const report = state.lastGenerationReport;
        const semesterForm = '<form id="semester-form" class="d-flex align-items-end gap-2"><div><label class="form-label mb-1" for="semester-input">Semestre</label>' +
            '<input id="semester-input" class="form-control form-control-sm" value="' + h(semester) + '" pattern="\\d{4}/[12]" placeholder="AAAA/1" required></div>' +
            '<button class="btn btn-sm btn-outline-primary" type="submit">Aplicar</button></form>';
        const turmaSelect = '<select class="form-select form-select-sm" id="grade-class-select">' + turmas.map(function (turma) {
            return '<option value="' + h(turma.id) + '"' + (selectedTurma && String(turma.id) === String(selectedTurma.id) ? ' selected' : '') + '>' + h(turma.nome) + '</option>';
        }).join('') + '</select>';
        const days = DAYS;
        let grade = '';
        if (selectedTurma && slots.length) {
            const sorted = slots.slice().sort(function (a, b) {
                return String(a.hora_inicio).localeCompare(String(b.hora_inicio)) || String(a.hora_fim).localeCompare(String(b.hora_fim));
            });
            const rowKeys = Array.from(new Set(sorted.map(function (slot) { return String(slot.hora_inicio) + '|' + String(slot.hora_fim); })));
            const header = '<thead><tr><th>Período</th>' + days.map(function (day) { return '<th>' + day + '</th>'; }).join('') + '</tr></thead>';
            const body = rowKeys.map(function (range) {
                const times = range.split('|');
                const cells = days.map(function (day) {
                    const slot = sorted.find(function (item) { return item.dia_semana === day && String(item.hora_inicio) === times[0] && String(item.hora_fim) === times[1]; });
                    if (!slot) return '<td><span class="text-muted">—</span></td>';
                    const assignment = assignments.find(function (item) {
                        return String(item.turma_id) === String(selectedTurma.id) && String(item.dia_semana) === day && String(item.horario_id) === String(slot.id);
                    });
                    if (!assignment) {
                        return '<td><button class="grade-empty" type="button" data-action="select-slot" data-class-id="' + h(selectedTurma.id) + '" data-day="' + h(day) + '" data-slot-id="' + h(slot.id) + '" aria-label="Adicionar aula em ' + h(day) + '"></button></td>';
                    }
                    return '<td><button class="grade-entry" type="button" data-action="remove-assignment" data-id="' + h(assignment.id) + '" title="Remover aula">' +
                        '<strong>' + h(assignment.disciplina_nome || nameById(KEYS.disciplinas, assignment.disciplina_id, 'Disciplina')) + '</strong>' +
                        '<small>' + h(assignment.professor_nome || nameById(KEYS.professores, assignment.professor_id, 'Professor')) + '</small></button></td>';
                }).join('');
                return '<tr><th>' + h(times[0]) + '–' + h(times[1]) + '</th>' + cells + '</tr>';
            }).join('');
            grade = '<div class="table-responsive"><table class="table table-bordered align-middle grade-table mb-0">' + header + '<tbody>' + body + '</tbody></table></div>';
        } else {
            grade = '<div class="empty-state"><i class="bi bi-calendar-x"></i>' + (selectedTurma ? 'Cadastre os horários de aula para montar a grade.' : 'Cadastre uma turma ativa para montar a grade.') + '</div>';
        }
        const total = assignments.filter(function (item) { return !selectedTurma || String(item.turma_id) === String(selectedTurma.id); }).length;
        const reportSummary = report && report.resumo ? report.resumo : report;
        const reportDate = report && (report.geradoEm || report.generatedAt);
        const reportComplete = report && (report.completo === true || reportSummary.completo === true || report.status === 'completa');
        const summary = report && reportDate ? '<div class="alert ' + (reportComplete ? 'alert-success' : 'alert-warning') + ' mb-0">' +
            '<strong>Última geração:</strong> ' + h(reportSummary.totalAtendidas || 0) + ' de ' + h(reportSummary.totalPrevistas || 0) +
            ' aulas atendidas (' + h(reportSummary.percentual || 0) + '%).' + (reportSummary.totalPendentes ? ' Pendentes: ' + h(reportSummary.totalPendentes) + '.' : '') +
            '<div class="small mt-1">Gerada em ' + h(formatDate(reportDate)) + (report.metodo ? ' · ' + h(report.metodo) : '') + '</div></div>' :
            '<div class="text-muted small">Nenhuma geração QDP registrada para este semestre.</div>';
        const manual = renderManualAssignment(selectedTurma, slots);
        return pageHeader('Grade oficial', 'bi-calendar3', 'Gere uma proposta com o QDP, revise os conflitos e ajuste aulas manualmente.') +
            '<div class="card mb-3"><div class="card-body d-flex flex-wrap justify-content-between align-items-end gap-3">' +
            semesterForm + '<div class="d-flex flex-wrap gap-2"><button class="btn btn-primary" type="button" data-action="generate-grade"><i class="bi bi-magic me-1"></i>Gerar grade QDP</button>' +
            '<button class="btn btn-outline-primary" type="button" data-action="export-grade">Exportar JSON</button>' +
            '<button class="btn btn-outline-secondary" type="button" data-action="print">Imprimir</button>' +
            '<button class="btn btn-outline-danger" type="button" data-action="clear-grade">Limpar grade</button></div></div></div>' +
            '<div class="row g-3 mb-3"><div class="col-lg-8"><div class="card h-100"><div class="card-header d-flex align-items-center justify-content-between gap-2"><strong>Grade da turma</strong><div style="min-width:220px">' + turmaSelect + '</div></div>' +
            '<div class="card-body">' + grade + '<div class="small text-muted mt-2">' + total + ' aula(s) atribuída(s) nesta turma.</div></div></div></div>' +
            '<div class="col-lg-4"><div class="card h-100"><div class="card-header">Relatório QDP</div><div class="card-body">' + summary + '</div></div></div></div>' +
            manual + '<p class="small text-muted mt-3"><i class="bi bi-info-circle me-1"></i>As alterações são gravadas no navegador. A geração não substitui a revisão pedagógica da escola.</p>';
    }

    function renderManualAssignment(turma, slots) {
        const teachers = activeRecords(KEYS.professores, ['ativo']);
        const disciplines = readRecords(KEYS.disciplinas);
        if (!turma) return '';
        return '<div class="card"><div class="card-header">Ajuste manual de aula</div><div class="card-body">' +
            '<form id="manual-assignment-form" class="row g-3" data-class-id="' + h(turma.id) + '">' +
            '<div class="col-md-3"><label class="form-label" for="manual-day">Dia</label><select class="form-select" name="dia_semana" id="manual-day" required>' +
            DAYS.map(function (day) { return '<option value="' + h(day) + '">' + h(day) + '</option>'; }).join('') + '</select></div>' +
            '<div class="col-md-3"><label class="form-label" for="manual-slot">Período</label><select class="form-select" name="horario_id" id="manual-slot" required>' +
            slots.map(function (slot) { return '<option value="' + h(slot.id) + '" data-day="' + h(slot.dia_semana) + '">' + h(slot.dia_semana + ' · ' + slot.hora_inicio + '–' + slot.hora_fim) + '</option>'; }).join('') + '</select></div>' +
            '<div class="col-md-3"><label class="form-label" for="manual-subject">Disciplina</label><select class="form-select" name="disciplina_id" id="manual-subject" required>' +
            disciplines.map(function (item) { return '<option value="' + h(item.id) + '">' + h(item.nome) + '</option>'; }).join('') + '</select></div>' +
            '<div class="col-md-3"><label class="form-label" for="manual-teacher">Professor</label><select class="form-select" name="professor_id" id="manual-teacher" required>' +
            teachers.map(function (item) { return '<option value="' + h(item.id) + '">' + h(item.nome) + '</option>'; }).join('') + '</select></div>' +
            '<div class="col-12"><button class="btn btn-outline-primary" type="submit"><i class="bi bi-plus-circle me-1"></i>Adicionar aula</button></div></form></div></div>';
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
        const semester = getSemester();
        const state = readSimulation(semester);
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

    function addManualAssignment(form) {
        const data = new FormData(form);
        const turmaId = String(form.dataset.classId || '');
        const day = String(data.get('dia_semana') || '');
        const slotId = Number(data.get('horario_id') || 0);
        const subjectId = Number(data.get('disciplina_id') || 0);
        const teacherId = Number(data.get('professor_id') || 0);
        const slot = findById(KEYS.horarios, slotId);
        const subject = findById(KEYS.disciplinas, subjectId);
        const teacher = findById(KEYS.professores, teacherId);
        if (!turmaId || !slot || !subject || !teacher || slot.dia_semana !== day) throw new Error('Revise a turma, o dia, o horário, a disciplina e o professor selecionados.');
        const semester = getSemester();
        const state = readSimulation(semester);
        const conflict = state.assignments.find(function (item) {
            if (String(item.dia_semana) !== day || String(item.horario_id) !== String(slotId)) return false;
            return String(item.turma_id) === turmaId || String(item.professor_id) === String(teacherId);
        });
        if (conflict && !window.confirm('Este horário já está ocupado para a turma ou para o professor. Adicionar mesmo assim?')) return;
        state.assignments.push({
            id: nextId(state.assignments),
            turma_id: Number(turmaId), dia_semana: day, horario_id: slotId,
            disciplina_id: subjectId, disciplina_nome: subject.nome,
            professor_id: teacherId, professor_nome: teacher.nome,
            hora_inicio: slot.hora_inicio, hora_fim: slot.hora_fim, origem: 'manual'
        });
        state.activeTurmaId = Number(turmaId);
        saveSimulation(semester, state);
        render();
        notify('Aula adicionada à grade local.', 'success');
    }

    function removeAssignment(id) {
        const semester = getSemester();
        const state = readSimulation(semester);
        state.assignments = state.assignments.filter(function (item) { return String(item.id) !== String(id); });
        saveSimulation(semester, state);
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

    function renderStudio() {
        const semester = getSemester();
        const state = readSimulation(semester);
        const turmas = activeRecords(KEYS.turmas, ['ativa', 'ativo']);
        const selectedId = String(state.activeTurmaId || (turmas[0] && turmas[0].id) || '');
        const selected = turmas.find(function (item) { return String(item.id) === selectedId; }) || turmas[0];
        const assignments = (state.assignments || []).filter(function (item) {
            return selected && String(item.turma_id) === String(selected.id);
        });
        const assignmentSummary = window.OwltimeGradeLocal.summarizeAssignments(
            assignments,
            readRecords(KEYS.professores),
            turmas,
            readRecords(KEYS.disciplinas)
        );
        const totalDemand = selected ? getDemandsForClass(selected.id).reduce(function (sum, item) { return sum + item.aulas_semanais; }, 0) : 0;
        const teacherRows = assignmentSummary.porProfessor.map(function (item) {
            const ratio = totalDemand ? Math.min(100, Math.round(item.total / totalDemand * 100)) : 0;
            return '<div class="metric-row"><div class="flex-grow-1"><strong>' + h(item.nome) + '</strong><div class="meter mt-2"><span style="width:' + ratio + '%"></span></div></div><span class="badge text-bg-primary">' + item.total + ' aula(s)</span></div>';
        }).join('');
        const demandRows = selected ? getDemandsForClass(selected.id).map(function (item) {
            const allocated = assignments.filter(function (assignment) { return String(assignment.disciplina_id) === String(item.disciplina_id); }).length;
            return '<div class="metric-row"><span>' + h(item.disciplina_nome) + '</span><span class="text-muted">' + allocated + ' / ' + item.aulas_semanais + '</span></div>';
        }).join('') : '';
        return pageHeader('Studio de análise', 'bi-bezier2', 'Compare a distribuição das aulas por professor e disciplina usando a grade salva localmente.') +
            '<div class="card mb-3"><div class="card-body row g-3 align-items-end"><div class="col-sm-4"><label class="form-label" for="studio-semester">Semestre</label><input class="form-control" id="studio-semester" value="' + h(semester) + '" pattern="\\d{4}/[12]"></div>' +
            '<div class="col-sm-5"><label class="form-label" for="studio-class">Turma</label><select class="form-select" id="studio-class">' + turmas.map(function (item) {
                return '<option value="' + h(item.id) + '"' + (selected && String(item.id) === String(selected.id) ? ' selected' : '') + '>' + h(item.nome) + '</option>';
            }).join('') + '</select></div><div class="col-sm-3"><button class="btn btn-outline-primary w-100" type="button" data-action="studio-apply">Aplicar</button></div></div></div>' +
            '<div class="row g-3"><div class="col-lg-6"><div class="card h-100"><div class="card-header">Carga por professor</div><div class="card-body">' +
            (teacherRows || '<div class="empty-state"><i class="bi bi-bar-chart"></i>Gere ou ajuste uma grade para ver a distribuição.</div>') +
            '</div></div></div><div class="col-lg-6"><div class="card h-100"><div class="card-header">Demanda × aulas alocadas</div><div class="card-body">' +
            (demandRows || '<div class="empty-state"><i class="bi bi-journal-check"></i>Cadastre demandas para comparar com a grade.</div>') +
            '</div></div></div></div><div class="small text-muted mt-3">Semestre ' + h(semester) + ' · ' + assignments.length + ' aula(s) na turma ' + h(selected ? selected.nome : '—') + '.</div>';
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
            '<div class="card mt-3"><div class="card-header">Pendências da última geração</div><div class="card-body">' +
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
            '</div></div></div></div><div class="col-12"><div class="card"><div class="card-header">Gerar uma grade</div><div class="card-body">' +
            '<ol class="mb-0"><li>Cadastre os horários, cursos, professores, disciplinas e turmas.</li><li>Crie vínculos professor × disciplina, demandas semanais por turma e disponibilidade dos professores.</li>' +
            '<li>Abra <strong>Grade oficial</strong>, confirme o semestre e execute o QDP.</li><li>Revise as aulas pendentes e conflitos; a geração automática é uma proposta para validação da escola.</li></ol></div></div></div></div>';
    }

    function render() {
        const route = (window.location.hash.replace(/^#\/?/, '').split('/')[0] || 'dashboard');
        document.querySelectorAll('.side-link').forEach(function (link) {
            link.classList.toggle('active', link.dataset.route === route);
        });
        try {
            editing = editing && editing.route === route ? editing : null;
            if (specs[route]) view.innerHTML = renderCrud(route);
            else if (route === 'dashboard') view.innerHTML = renderDashboard();
            else if (route === 'grade') view.innerHTML = renderGrade();
            else if (route === 'studio') view.innerHTML = renderStudio();
            else if (route === 'relatorios') view.innerHTML = renderReports();
            else if (route === 'armazenamento') view.innerHTML = renderStorage();
            else if (route === 'ajuda') view.innerHTML = renderHelp();
            else view.innerHTML = '<div class="empty-state"><i class="bi bi-exclamation-circle"></i>Página não encontrada.</div>';
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

    function applySemesterFrom(inputId) {
        const semester = setSemester(document.getElementById(inputId).value);
        editing = null;
        render();
        notify('Semestre ' + semester + ' selecionado.', 'success');
    }

    function handleClick(event) {
        const button = event.target.closest('[data-action]');
        if (!button) return;
        const action = button.dataset.action;
        try {
            if (action === 'export-backup') exportBackup();
            else if (action === 'pick-backup') document.getElementById('backup-file').click();
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
                const day = document.getElementById('manual-day');
                const slot = document.getElementById('manual-slot');
                day.value = button.dataset.day;
                Array.from(slot.options).forEach(function (option) { option.selected = option.value === button.dataset.slotId; });
                document.getElementById('manual-assignment-form').scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else if (action === 'remove-assignment') {
                if (window.confirm('Remover esta aula da grade?')) removeAssignment(button.dataset.id);
            } else if (action === 'clear-grade') {
                if (window.confirm('Limpar todas as aulas e o relatório deste semestre?')) {
                    saveSimulation(getSemester(), { activeTurmaId: '', assignments: [], lastGenerationReport: null, qdpInfo: null, metodo: null });
                    render();
                    notify('Grade do semestre limpa.', 'success');
                }
            } else if (action === 'export-grade') {
                exportJson('owltime_grade_' + getSemester().replace('/', '-') + '.json', readSimulation(getSemester()));
            } else if (action === 'print') window.print();
            else if (action === 'studio-apply') {
                const semester = setSemester(document.getElementById('studio-semester').value);
                const classId = Number(document.getElementById('studio-class').value || 0);
                const state = readSimulation(semester);
                state.activeTurmaId = classId;
                saveSimulation(semester, state);
                render();
            } else if (action === 'report-apply') {
                setSemester(document.getElementById('report-semester').value);
                render();
            } else if (action === 'export-csv') exportGradeCsv();
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
        if (event.target.id === 'grade-class-select') {
            updateSimulation(function (state) { state.activeTurmaId = Number(event.target.value || 0); });
        } else if (event.target.id === 'manual-day') {
            const day = event.target.value;
            const slot = document.getElementById('manual-slot');
            const matching = Array.from(slot.options).find(function (option) { return option.dataset.day === day; });
            if (matching) matching.selected = true;
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

    document.addEventListener('click', handleClick);
    document.addEventListener('submit', handleSubmit);
    document.addEventListener('change', handleChange);
    document.addEventListener('input', handleInput);
    window.addEventListener('hashchange', function () { editing = null; render(); });
    if (!window.location.hash) window.location.hash = '#/dashboard';
    render();
})();
