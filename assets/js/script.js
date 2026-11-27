// Auto dismiss alerts
document.addEventListener('DOMContentLoaded', function () {
    setTimeout(function () {
        let alerts = document.querySelectorAll('.alert');
        alerts.forEach(function (alert) {
            alert.classList.add('fade');
            setTimeout(function () {
                alert.remove();
            }, 1000);
        });
    }, 3000);

    // Confirmar exclusões
    let deleteButtons = document.querySelectorAll('.btn-danger');
    deleteButtons.forEach(function (btn) {
        btn.addEventListener('click', function (e) {
            if (!confirm('Tem certeza que deseja excluir este registro?')) {
                e.preventDefault();
            }
        });
    });
});

// Máscara para telefone
document.addEventListener('DOMContentLoaded', function () {
    let telefoneInput = document.querySelector('#telefone');
    if (telefoneInput) {
        telefoneInput.addEventListener('input', function (e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 10) {
                value = value.replace(/^(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
            } else if (value.length > 6) {
                value = value.replace(/^(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
            } else if (value.length > 2) {
                value = value.replace(/^(\d{2})(\d{0,5})/, '($1) $2');
            }
            e.target.value = value;
        });
    }
});

// Arrastar e soltar de aulas na agenda
document.addEventListener('DOMContentLoaded', function () {
    let draggedAulaId = null;
    let origemHorarioId = null;
    let moving = false;

    const agenda = document.querySelector('.agenda-arrastavel');
    if (!agenda || agenda.dataset.storageMode === 'local') {
        return;
    }
    const aulas = document.querySelectorAll('.aula-draggable');
    const slots = document.querySelectorAll('.agenda-slot');
    const moverEndpoint = agenda && agenda.dataset.moverEndpoint ? agenda.dataset.moverEndpoint : '/owltime/modulos/horarios/mover_aula.php';

    function promptTrocaProfessor(aulaEl) {
        const aulaId = aulaEl.dataset.aulaId;
        if (!aulaId) {
            alert('Aula inválida para troca de professor.');
            return;
        }

        const disciplinaNome = aulaEl.dataset.disciplinaNome || '';
        const professorAtual = aulaEl.dataset.professorNome || 'Sem professor';

        const formData = new FormData();
        formData.append('aula_id', aulaId);
        formData.append('acao', 'listar_professores');

        fetch(moverEndpoint, {
            method: 'POST',
            body: formData
        })
            .then(function (response) {
                if (!response.ok) {
                    throw new Error('Falha ao comunicar com o servidor.');
                }
                return response.json();
            })
            .then(function (data) {
                console.log('listar_professores response', data);
                if (!data.success || !Array.isArray(data.professores)) {
                    alert(data.message || 'Não foi possível carregar os professores.');
                    return;
                }

                const opcoes = data.professores.filter(function (prof) {
                    return !prof.selecionado && prof.disponivel;
                });
                console.log('listar_professores opcoes', opcoes.length);

                if (!opcoes.length) {
                    alert('Nenhum professor disponível para esta aula no horário atual.');
                    return;
                }

                let promptTexto = 'Trocar professor para: ' + disciplinaNome + '\n';
                promptTexto += 'Professor atual: ' + professorAtual + '\n\n';
                promptTexto += 'Professores disponíveis:\n';
                opcoes.forEach(function (prof, index) {
                    promptTexto += (index + 1) + '. ' + prof.nome + ' — carga ' + prof.carga_horaria_semanal + 'h/sem. | alocadas ' + prof.alocadas + ' | saldo ' + prof.saldo + 'h\n';
                });
                promptTexto += '\nDigite o número do professor desejado:';

                const escolha = window.prompt(promptTexto);
                if (!escolha) {
                    return;
                }

                const indice = parseInt(escolha, 10) - 1;
                if (isNaN(indice) || indice < 0 || indice >= opcoes.length) {
                    alert('Escolha inválida.');
                    return;
                }

                const professorSelecionado = opcoes[indice];
                const formTroca = new FormData();
                formTroca.append('aula_id', aulaId);
                formTroca.append('acao', 'trocar_professor');
                formTroca.append('novo_professor_id', professorSelecionado.id);

                return fetch(moverEndpoint, {
                    method: 'POST',
                    body: formTroca
                });
            })
            .then(function (response) {
                if (!response) {
                    return;
                }
                if (!response.ok) {
                    throw new Error('Falha ao comunicar com o servidor.');
                }
                return response.json();
            })
            .then(function (resp) {
                if (!resp) {
                    return;
                }
                if (resp.success) {
                    window.location.reload();
                    return;
                }
                alert(resp.message || 'Não foi possível trocar o professor.');
            })
            .catch(function () {
                alert('Erro de comunicação ao processar a troca de professor.');
            });
    }

    function promptAdicionarAula(horarioId) {
        const turmaId = agenda.dataset.turmaId;
        const semestre = agenda.dataset.semestre;
        if (!turmaId || !semestre) {
            alert('Dados da turma ou semestre ausentes.');
            return;
        }

        let selectedDisciplinaId = 0;

        const form = new FormData();
        form.append('acao', 'listar_disciplinas');
        form.append('turma_id', turmaId);
        form.append('semestre', semestre);

        fetch(moverEndpoint, { method: 'POST', body: form })
            .then(function (response) {
                if (!response.ok) {
                    throw new Error('Falha ao carregar disciplinas.');
                }
                return response.json();
            })
            .then(function (data) {
                if (!data.success || !Array.isArray(data.disciplinas) || !data.disciplinas.length) {
                    alert(data.message || 'Nenhuma disciplina disponível para adicionar.');
                    return;
                }

                let promptTexto = 'Selecione a disciplina para adicionar:\n';
                data.disciplinas.forEach(function (disc, index) {
                    promptTexto += (index + 1) + '. ' + disc.nome + ' (' + disc.aulas_previstas + ' prev.)\n';
                });
                promptTexto += '\nDigite o número da disciplina:';

                const escolha = window.prompt(promptTexto);
                if (!escolha) {
                    return;
                }
                const indice = parseInt(escolha, 10) - 1;
                if (isNaN(indice) || indice < 0 || indice >= data.disciplinas.length) {
                    alert('Escolha inválida.');
                    return;
                }
                const disciplina = data.disciplinas[indice];
                selectedDisciplinaId = disciplina.disciplina_id;

                const formProf = new FormData();
                formProf.append('acao', 'listar_professores_disciplina');
                formProf.append('horario_id', horarioId);
                formProf.append('disciplina_id', selectedDisciplinaId);
                formProf.append('semestre', semestre);

                return fetch(moverEndpoint, { method: 'POST', body: formProf });
            })
            .then(function (response) {
                if (!response) {
                    return;
                }
                if (!response.ok) {
                    throw new Error('Falha ao carregar professores.');
                }
                return response.json();
            })
            .then(function (data) {
                if (!data) {
                    return;
                }
                if (!data.success || !Array.isArray(data.professores) || !data.professores.length) {
                    alert(data.message || 'Nenhum professor disponível para esta disciplina.');
                    return;
                }

                const professores = data.professores.filter(function (prof) {
                    return prof.disponivel;
                });
                if (!professores.length) {
                    alert('Nenhum professor disponível neste horário.');
                    return;
                }

                let promptTexto = 'Selecione o professor:\n';
                professores.forEach(function (prof, index) {
                    promptTexto += (index + 1) + '. ' + prof.nome + ' — saldo ' + prof.saldo + 'h' + (prof.motivo ? ' (' + prof.motivo + ')' : '') + '\n';
                });
                promptTexto += '\nDigite o número do professor:';

                const escolhaProf = window.prompt(promptTexto);
                if (!escolhaProf) {
                    return;
                }
                const indiceProf = parseInt(escolhaProf, 10) - 1;
                if (isNaN(indiceProf) || indiceProf < 0 || indiceProf >= professores.length) {
                    alert('Escolha inválida.');
                    return;
                }
                const professor = professores[indiceProf];

                const formAdd = new FormData();
                formAdd.append('acao', 'adicionar_aula');
                formAdd.append('turma_id', turmaId);
                formAdd.append('horario_id', horarioId);
                formAdd.append('disciplina_id', selectedDisciplinaId);
                formAdd.append('novo_professor_id', professor.id);
                formAdd.append('semestre', semestre);

                return fetch(moverEndpoint, { method: 'POST', body: formAdd });
            })
            .then(function (response) {
                if (!response) {
                    return;
                }
                if (!response.ok) {
                    throw new Error('Falha ao adicionar aula.');
                }
                return response.json();
            })
            .then(function (data) {
                if (!data) {
                    return;
                }
                if (data.success) {
                    window.location.reload();
                    return;
                }
                alert(data.message || 'Não foi possível adicionar a aula.');
            })
            .catch(function (err) {
                console.error(err);
                alert(err.message || 'Erro ao adicionar a aula.');
            });
    }

    function excluirAula(aulaId) {
        if (!confirm('Deseja realmente excluir esta aula?')) {
            return;
        }

        const formData = new FormData();
        formData.append('acao', 'excluir_aula');
        formData.append('aula_id', aulaId);

        fetch(moverEndpoint, { method: 'POST', body: formData })
            .then(function (response) {
                if (!response.ok) {
                    throw new Error('Falha ao excluir aula.');
                }
                return response.json();
            })
            .then(function (data) {
                if (data.success) {
                    window.location.reload();
                    return;
                }
                alert(data.message || 'Não foi possível excluir a aula.');
            })
            .catch(function (err) {
                console.error(err);
                alert(err.message || 'Erro ao excluir a aula.');
            });
    }

    if (!slots.length) {
        return;
    }

    aulas.forEach(function (aula) {
        aula.addEventListener('dragstart', function (e) {
            draggedAulaId = this.dataset.aulaId;
            origemHorarioId = this.dataset.origemHorarioId;
            this.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
        });

        aula.addEventListener('dragend', function () {
            this.classList.remove('dragging');
        });

        aula.addEventListener('dblclick', function (e) {
            e.preventDefault();
            e.stopPropagation();
            promptTrocaProfessor(this);
        });

        const botaoExcluir = aula.querySelector('.btn-excluir-aula');
        if (botaoExcluir) {
            botaoExcluir.addEventListener('click', function (e) {
                e.stopPropagation();
                excluirAula(this.dataset.aulaId);
            });
        }
    });

    slots.forEach(function (slot) {
        const botaoAdicionar = slot.querySelector('.btn-adicionar-aula');
        if (botaoAdicionar) {
            botaoAdicionar.addEventListener('click', function (e) {
                e.stopPropagation();
                promptAdicionarAula(this.dataset.horarioId);
            });
        }

        slot.addEventListener('dragover', function (e) {
            e.preventDefault();
            this.classList.remove('drop-hover-invalid', 'drop-hover-valid');
            if (!draggedAulaId || !this.dataset.horarioId || this.dataset.horarioId === origemHorarioId) {
                this.classList.add('drop-hover-invalid');
            } else {
                this.classList.add('drop-hover-valid');
            }
        });

        slot.addEventListener('dragleave', function () {
            this.classList.remove('drop-hover-valid', 'drop-hover-invalid');
        });

        slot.addEventListener('drop', function (e) {
            e.preventDefault();
            this.classList.remove('drop-hover-valid', 'drop-hover-invalid');

            if (moving) {
                return;
            }

            const destinoHorarioId = this.dataset.horarioId;
            if (!draggedAulaId || !destinoHorarioId || destinoHorarioId === origemHorarioId) {
                return;
            }

            const aulaDestino = this.querySelector('.aula-draggable');

            const formData = new FormData();
            formData.append('aula_id', draggedAulaId);
            formData.append('dest_horario_id', destinoHorarioId);
            if (aulaDestino && aulaDestino.dataset.aulaId) {
                formData.append('troca_aula_id', aulaDestino.dataset.aulaId);
            }

            moving = true;

            fetch(moverEndpoint, {
                method: 'POST',
                body: formData
            })
                .then(function (response) {
                    if (!response.ok) {
                        throw new Error('Falha ao comunicar com o servidor.');
                    }
                    return response.json();
                })
                .then(function (data) {
                    if (data.success) {
                        window.location.reload();
                        return;
                    }
                    alert(data.message || 'Não foi possível mover a aula.');
                })
                .catch(function () {
                    alert('Erro de comunicação ao mover aula.');
                })
                .finally(function () {
                    moving = false;
                });
        });
    });
});
