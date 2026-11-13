/**
 * QDP Engine - Quadrante da Divisão Perfeita
 * Versão 21.1 - CORREÇÃO DE ALOCAÇÃO DE CARGA COMPLETA
 */

class QDPEngine {
  constructor(config) {
    this.version = "21.1";
    this.dias = config.dias || [
      "Segunda",
      "Terça",
      "Quarta",
      "Quinta",
      "Sexta",
    ];
    this.horarios = config.horarios || [];
    this.turmas = config.turmas || [];
    this.professores = config.professores || [];
    this.disciplinas = config.disciplinas || [];
    this.vinculos = config.vinculos || {};
    this.grupos = config.grupos || [];
    this.demandaPorTurma = config.demandaPorTurma || {};
    this.disponibilidades = config.disponibilidades || {};
    this.protecoes = config.protecoes || [];
    this.maxAulasDia = config.maxAulasDia || 6;
    this.maxCargaProfessor = config.maxCargaProfessor || 40;
    this.logs = [];

    this.permitirTresAulasNoDia = true;

    this._log = function (msg) {
      this.logs.push(msg);
      console.log(msg);
    }.bind(this);

    this.distribuicaoPorDisciplina = this._calcularDistribuicao();
    this.professorPrimarioMap = this._construirMapaProfessorPrimario();
  }

  // ==========================================
  // CALCULAR DISTRIBUIÇÃO EQUILIBRADA
  // ==========================================

  _calcularDistribuicao() {
    const distribuicao = {};

    const turmasPorDisciplina = {};
    this.turmas.forEach((turma) => {
      const demanda = this.demandaPorTurma[turma.id] || [];
      demanda.forEach((item) => {
        const discId = Number(item.disciplina_id);
        if (!discId) return;
        const key = String(discId);
        if (!turmasPorDisciplina[key]) turmasPorDisciplina[key] = [];
        turmasPorDisciplina[key].push({
          turmaId: turma.id,
          turmaNome: turma.nome,
          aulas: Number(item.aulas_previstas) || 0,
        });
      });
    });

    for (const [discId, turmas] of Object.entries(turmasPorDisciplina)) {
      const professores = this.vinculos[discId] || [];
      if (professores.length === 0) continue;

      if (professores.some((professor) => (professor.grupo_ids || []).length > 0)) {
        const distribuicaoPorProf = new Map();
        const aulasPorProf = new Map();
        const turmasOrdenadas = [...turmas].sort((a, b) => {
          const elegiveisA = this._professoresElegiveisParaTurma(professores, a.turmaId).length;
          const elegiveisB = this._professoresElegiveisParaTurma(professores, b.turmaId).length;
          if (elegiveisA !== elegiveisB) return elegiveisA - elegiveisB;
          const numA = parseInt(a.turmaNome) || 0;
          const numB = parseInt(b.turmaNome) || 0;
          if (numA !== numB) return numA - numB;
          return a.turmaNome.localeCompare(b.turmaNome);
        });

        turmasOrdenadas.forEach((turma) => {
          const elegiveis = this._professoresElegiveisParaTurma(professores, turma.turmaId);
          const escolhido = elegiveis.slice().sort((a, b) => {
            const cargaA = aulasPorProf.get(Number(a.id)) || 0;
            const cargaB = aulasPorProf.get(Number(b.id)) || 0;
            return cargaA - cargaB || String(a.nome || "").localeCompare(String(b.nome || ""));
          })[0];
          if (!escolhido) return;
          const professorId = Number(escolhido.id);
          if (!distribuicaoPorProf.has(professorId)) {
            distribuicaoPorProf.set(professorId, { id: professorId, nome: escolhido.nome, turmas: [] });
          }
          distribuicaoPorProf.get(professorId).turmas.push({ ...turma });
          aulasPorProf.set(professorId, (aulasPorProf.get(professorId) || 0) + turma.aulas);
        });

        distribuicao[discId] = { professores: Array.from(distribuicaoPorProf.values()) };
        distribuicao[discId].professores.forEach((professor) => {
          const nomes = professor.turmas.map((turma) => turma.turmaNome).join(", ");
          const totalAulas = professor.turmas.reduce((soma, turma) => soma + turma.aulas, 0);
          this._log(`📊 Distribuição de ${this._getNomeDisciplina(Number(discId))}:`);
          this._log(`   📌 ${professor.nome}: ${nomes} (${totalAulas} aulas)`);
        });
        continue;
      }

      if (professores.length === 1) {
        distribuicao[discId] = {
          professores: professores.map((p) => ({
            id: p.id,
            nome: p.nome,
            turmas: turmas.map((t) => ({ ...t })),
          })),
        };
        continue;
      }

      const turmasOrdenadas = [...turmas].sort((a, b) => {
        const numA = parseInt(a.turmaNome) || 0;
        const numB = parseInt(b.turmaNome) || 0;
        if (numA !== numB) return numA - numB;
        return a.turmaNome.localeCompare(b.turmaNome);
      });

      const profsOrdenados = [...professores].sort((a, b) => {
        if (discId === "1") {
          const nomeA = String(a.nome || "").toLowerCase();
          const nomeB = String(b.nome || "").toLowerCase();
          if (nomeA.includes("luiza")) return -1;
          if (nomeB.includes("luiza")) return 1;
          if (nomeA.includes("thiago")) return 1;
          if (nomeB.includes("thiago")) return -1;
        }
        return String(a.nome || "").localeCompare(String(b.nome || ""));
      });

      const totalTurmas = turmasOrdenadas.length;
      const totalProfessores = profsOrdenados.length;

      const turmasPorProf = Math.floor(totalTurmas / totalProfessores);
      const sobra = totalTurmas % totalProfessores;

      const distribuicaoProf = [];
      let idx = 0;
      for (let i = 0; i < totalProfessores; i++) {
        const qtd = turmasPorProf + (i < sobra ? 1 : 0);
        const turmasProf = turmasOrdenadas.slice(idx, idx + qtd);
        idx += qtd;
        distribuicaoProf.push({
          professor: profsOrdenados[i],
          turmas: turmasProf,
        });
      }

      const discNome = this._getNomeDisciplina(Number(discId));
      this._log(`📊 Distribuição de ${discNome}:`);
      distribuicaoProf.forEach((item) => {
        const nomes = item.turmas.map((t) => t.turmaNome).join(", ");
        const totalAulas = item.turmas.reduce((s, t) => s + t.aulas, 0);
        this._log(
          `   📌 ${item.professor.nome}: ${nomes} (${totalAulas} aulas)`,
        );
      });

      distribuicao[discId] = {
        professores: distribuicaoProf.map((item) => ({
          id: item.professor.id,
          nome: item.professor.nome,
          turmas: item.turmas,
        })),
      };
    }

    return distribuicao;
  }

  _professorPertenceAoGrupo(professor, turmaId) {
    const grupoIds = Array.isArray(professor.grupo_ids) ? professor.grupo_ids.map(String) : [];
    if (!grupoIds.length) return false;
    return this.grupos.some((grupo) =>
      grupoIds.includes(String(grupo.id)) &&
      Array.isArray(grupo.turma_ids) &&
      grupo.turma_ids.some((id) => Number(id) === Number(turmaId)),
    );
  }

  _professoresElegiveisParaTurma(professores, turmaId) {
    const vinculados = professores || [];
    const restritos = vinculados.filter((professor) =>
      Array.isArray(professor.grupo_ids) && professor.grupo_ids.length > 0,
    );
    if (!restritos.length) return vinculados;
    const especificos = restritos.filter((professor) =>
      this._professorPertenceAoGrupo(professor, turmaId),
    );
    if (especificos.length) return especificos;
    return vinculados.filter((professor) =>
      !Array.isArray(professor.grupo_ids) || professor.grupo_ids.length === 0,
    );
  }

  // ==========================================
  // CONSTRUIR MAPA DE PROFESSOR PRIMÁRIO
  // ==========================================

  _construirMapaProfessorPrimario() {
    const mapa = {};

    for (const [discId, data] of Object.entries(
      this.distribuicaoPorDisciplina,
    )) {
      for (const prof of data.professores) {
        for (const turma of prof.turmas) {
          const chave = `${turma.turmaId}|${discId}`;
          mapa[chave] = Number(prof.id);
        }
      }
    }

    this._log("📌 MAPA DE PROFESSORES PRIMÁRIOS:");
    for (const [chave, profId] of Object.entries(mapa)) {
      const [turmaId, disciplinaId] = chave.split("|").map(Number);
      const turma = this.turmas.find((t) => t.id === turmaId);
      const disc = this.disciplinas.find((d) => d.id === disciplinaId);
      const prof = this.professores.find((p) => p.id === profId);
      if (turma && disc && prof) {
        this._log(`   📌 ${turma.nome} - ${disc.nome} -> ${prof.nome}`);
      }
    }

    return mapa;
  }

  _obterProfessorPrimario(turmaId, disciplinaId) {
    const chave = `${turmaId}|${disciplinaId}`;
    const primarioId = this.professorPrimarioMap[chave];
    if (primarioId) {
      return (
        this.professores.find((p) => Number(p.id) === Number(primarioId)) ||
        null
      );
    }
    return null;
  }

  // ==========================================
  // VERIFICAÇÕES DE RESTRIÇÕES
  // ==========================================

  _professorDisponivel(professorId, dia, horarioId) {
    const disponibilidade = this.disponibilidades[professorId];
    if (!disponibilidade) return true;

    const diasDisponiveis = disponibilidade.dias_semana || [];
    if (diasDisponiveis.length > 0) {
      const diaEncontrado = diasDisponiveis.some((d) => d === dia);
      if (!diaEncontrado) return false;
    }

    const restricoes = disponibilidade.restricoes || [];
    for (const restricao of restricoes) {
      if (restricao.dia_semana === dia && restricao.horario_id === horarioId) {
        if (restricao.tipo === "indisponivel") return false;
      }
    }

    return true;
  }

  _verificarRestricaoDisciplina(disciplinaId, dia, horarioId) {
    const disciplina = this.disciplinas.find(
      (d) => Number(d.id) === Number(disciplinaId),
    );
    if (!disciplina) return true;

    const restricoes = disciplina.restricoes || {};

    if (restricoes.apenas_aulas && Array.isArray(restricoes.apenas_aulas)) {
      const horario = this.horarios.find((h) => h.id === horarioId);
      if (horario) {
        const ordem = horario.ordem_aula || 0;
        if (!restricoes.apenas_aulas.includes(ordem)) return false;
      }
    }

    if (restricoes.apenas_dias && Array.isArray(restricoes.apenas_dias)) {
      if (!restricoes.apenas_dias.includes(dia)) return false;
    }

    if (restricoes.proibido_dias && Array.isArray(restricoes.proibido_dias)) {
      if (restricoes.proibido_dias.includes(dia)) return false;
    }

    return true;
  }

  _turnoByHora(horaInicio) {
    const hh = Number(String(horaInicio || "00:00").split(":")[0] || 0);
    if (hh < 12) return "manha";
    if (hh < 18) return "tarde";
    return "noite";
  }

  _normalizarPeriodo(periodo) {
    return String(periodo || "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  _horarioPermitidoTurma(turmaId, horarioId, diaSemana) {
    const turma = this.turmas.find((t) => Number(t.id) === Number(turmaId));
    const horario = this.horarios.find(
      (h) => Number(h.id) === Number(horarioId),
    );
    if (!turma || !horario) return true;
    const dia = diaSemana || horario.dia_semana;
    if (this.protecoes.some((protection) =>
      Number(protection.turma_id) === Number(turmaId) &&
      Number(protection.horario_id) === Number(horarioId) &&
      String(protection.dia_semana) === String(dia)
    )) return false;

    const periodo = this._normalizarPeriodo(turma.periodo || "");
    const turno = this._turnoByHora(horario.hora_inicio);

    if (periodo === "matutino" || periodo === "manha") return turno === "manha";
    if (periodo === "vespertino" || periodo === "tarde")
      return turno === "tarde";
    if (periodo === "noturno" || periodo === "noite") return turno === "noite";
    if (periodo === "integral") return turno === "manha" || turno === "tarde";

    return true;
  }

  _getNomeDisciplina(discId) {
    const disc = this.disciplinas.find((d) => Number(d.id) === Number(discId));
    return disc ? disc.nome : "Disciplina #" + discId;
  }

  _limiteProfessorDia(professorId) {
    const prof = this.professores.find(
      (p) => Number(p.id) === Number(professorId),
    );
    const limiteIndividual = Number((prof && prof.limite_aulas_dia) || 0);
    if (limiteIndividual > 0) return limiteIndividual;
    return Number(this.maxAulasDia || 6);
  }

  _getProfessorNome(profId) {
    const prof = this.professores.find((p) => Number(p.id) === Number(profId));
    return prof ? prof.nome : "Professor #" + profId;
  }

  _ordenarHorarios() {
    return [...this.horarios].sort((a, b) => {
      const diaA = this.dias.indexOf(a.dia_semana);
      const diaB = this.dias.indexOf(b.dia_semana);
      if (diaA !== diaB) return diaA - diaB;
      return String(a.hora_inicio || "").localeCompare(
        String(b.hora_inicio || ""),
      );
    });
  }

  _getCargaProfessor(assignments, professorId) {
    return assignments.filter(
      (a) => Number(a.professor_id) === Number(professorId),
    ).length;
  }

  // ==========================================
  // CORREÇÃO: Verificação de alocação com limite flexível
  // ==========================================

  _podeAlocarComProfessor(
    assignments,
    turmaId,
    disciplinaId,
    professorId,
    dia,
    horarioId,
    ignoreId = null,
    relaxarLimiteDia = false,
    permitirTres = false,
    ignorarDisponibilidade = false,  // NOVO PARÂMETRO
) {
    const professoresDaDisciplina = this.vinculos[String(disciplinaId)] || [];
    const elegiveis = this._professoresElegiveisParaTurma(professoresDaDisciplina, turmaId);
    if (professoresDaDisciplina.length && !elegiveis.some((professor) => Number(professor.id) === Number(professorId))) return false;

    // Verifica se o horário é permitido para a turma
    if (!this._horarioPermitidoTurma(turmaId, horarioId, dia)) return false;
    
    // Verifica restrições da disciplina
    if (!this._verificarRestricaoDisciplina(disciplinaId, dia, horarioId))
        return false;
    
    // ==========================================
    // CORREÇÃO: Só verifica disponibilidade se NÃO for ignorada
    // ==========================================
    if (!ignorarDisponibilidade) {
        if (!this._professorDisponivel(professorId, dia, horarioId)) return false;
    }

    // Verifica carga máxima do professor
    const cargaAtual = this._getCargaProfessor(assignments, professorId);
    if (cargaAtual >= this.maxCargaProfessor) return false;

    // Verifica se a turma já tem aula neste horário
    if (
        assignments.some(
            (a) =>
                Number(a.turma_id) === Number(turmaId) &&
                a.dia_semana === dia &&
                Number(a.horario_id) === Number(horarioId) &&
                a.id !== ignoreId,
        )
    )
        return false;

    // Verifica se o professor já tem aula neste horário
    if (
        assignments.some(
            (a) =>
                Number(a.professor_id) === Number(professorId) &&
                a.dia_semana === dia &&
                Number(a.horario_id) === Number(horarioId) &&
                a.id !== ignoreId,
        )
    )
        return false;

    // Verifica limite de aulas da mesma disciplina no dia
    const aulasDisciplinaDia = assignments.filter(
        (a) =>
            Number(a.turma_id) === Number(turmaId) &&
            Number(a.disciplina_id) === Number(disciplinaId) &&
            a.dia_semana === dia &&
            a.id !== ignoreId,
    ).length;

    let maxPermitido = 2;
    if (relaxarLimiteDia) {
        maxPermitido = 3;
    }
    if (permitirTres) {
        maxPermitido = 4;
    }
    if (aulasDisciplinaDia >= maxPermitido) return false;

    // Verifica limite de aulas do professor no dia
    const aulasProfessorDia = assignments.filter(
        (a) =>
            Number(a.professor_id) === Number(professorId) &&
            a.dia_semana === dia &&
            a.id !== ignoreId,
    ).length;
    if (aulasProfessorDia >= this._limiteProfessorDia(professorId))
        return false;

    return true;
}

  // ==========================================
  // MÉTODO PRINCIPAL
  // ==========================================

  gerarGradeCompleta() {
    const inicio = performance.now();
    this.logs = [];

    this._log(
      "🚀 Iniciando QDP v" +
        this.version +
        " - DISTRIBUIÇÃO EQUILIBRADA POR TURMAS",
    );

    this._log("📊 Distribuição de turmas por disciplina:");
    for (const [discId, data] of Object.entries(
      this.distribuicaoPorDisciplina,
    )) {
      const discNome = this._getNomeDisciplina(Number(discId));
      this._log(`   📚 ${discNome}:`);
      for (const prof of data.professores) {
        const turmasNomes = prof.turmas.map((t) => t.turmaNome).join(", ");
        const totalAulas = prof.turmas.reduce((s, t) => s + t.aulas, 0);
        this._log(
          `      👤 ${prof.nome}: ${turmasNomes} (${totalAulas} aulas)`,
        );
      }
    }

    const demandas = this._coletarDemandas();
    const totalDemanda = demandas.reduce((acc, d) => acc + d.qtd, 0);
    this._log(`📊 Demanda total: ${totalDemanda} aulas`);
    this._log(`📊 Limite de aulas por dia por professor: ${this.maxAulasDia}`);
    this._log(`📊 Carga máxima por professor: ${this.maxCargaProfessor}`);

    // FASE 1: Alocação inicial - permite 4 aulas da mesma disciplina por dia
    this._log(
      "📋 FASE 1: Alocação com APENAS professores primários (4 aulas/dia)",
    );
    let assignments = this._alocarApenasPrimarios(demandas);
    this._log(`   FASE 1: ${assignments.length} aulas alocadas`);

    // FASE 2: Fallback
    this._log("📋 FASE 2: Fallback para aulas restantes");
    assignments = this._alocarFallback(assignments, demandas);
    this._log(`   FASE 2: ${assignments.length} aulas alocadas no total`);

    // FASE 3: Algoritmo de reparo
    this._log(
      "📋 FASE 3: Algoritmo de reparo - buscando soluções para aulas pendentes",
    );
    assignments = this._repararPendencias(assignments, demandas);
    this._log(`   FASE 3: ${assignments.length} aulas alocadas no total`);

    // FASE 4: Escalonamento
    this._log(
      "📋 FASE 4: Escalonamento - redistribuindo carga entre professores",
    );
    assignments = this._escalonarCarga(assignments, demandas);
    this._log(`   FASE 4: ${assignments.length} aulas alocadas no total`);

    // FASE 5: Reposicionamento inteligente
    this._log(
      "📋 FASE 5: Reposicionamento inteligente - movendo aulas para liberar espaço",
    );
    assignments = this._reposicionarParaCompletar(assignments, demandas);
    this._log(`   FASE 5: ${assignments.length} aulas alocadas no total`);

    // FASE 6: Último recurso - 3 aulas no dia (com relaxarLimiteDia = true)
    this._log(
      "📋 FASE 6: ÚLTIMO RECURSO - permitindo 3 aulas da mesma disciplina no dia",
    );
    assignments = this._forcarComTresAulas(assignments, demandas);
    this._log(`   FASE 6: ${assignments.length} aulas alocadas no total`);

    // FASE 7: Reposicionamento forçado
    this._log(
      "📋 FASE 7: REPOSICIONAMENTO FORÇADO - mover qualquer aula para completar",
    );
    assignments = this._reposicionamentoForcado(assignments, demandas);
    this._log(`   FASE 7: ${assignments.length} aulas alocadas no total`);

    // FASE 8: Correção final
    this._log("📋 FASE 8: Correção final - forçar professor primário");
    assignments = this._forcarProfessorPrimarioFinal(assignments);
    this._log(`   FASE 8: ${assignments.length} aulas no total`);

    assignments = this._aplicarValidacaoFinalEstrita(assignments);
    const relatorio = this._gerarRelatorio(assignments, demandas);

    const tempo = ((performance.now() - inicio) / 1000).toFixed(2);

    const totalEsperado = demandas.reduce((acc, d) => acc + d.qtd, 0);
    const totalAtendido = assignments.length;
    const completo = totalAtendido === totalEsperado;

    this._log(
      completo
        ? "✅ GRADE COMPLETA!"
        : `⚠️ FALTAM ${totalEsperado - totalAtendido} aulas`,
    );

    return {
      assignments,
      relatorio,
      tempo: tempo + "s",
      metodo: "QDP v" + this.version,
      completo: completo,
      logs: this.logs,
    };
  }

  // ==========================================
  // COLETA DE DEMANDAS
  // ==========================================

  _coletarDemandas() {
    const demandas = [];

    this.turmas.forEach((turma) => {
      const req = this.demandaPorTurma[turma.id] || [];

      req.forEach((r) => {
        const qtd = Number(r.aulas_previstas) || 0;
        if (qtd <= 0) return;

        const discId = Number(r.disciplina_id);
        const discNome = r.disciplina_nome || this._getNomeDisciplina(discId);
        const profs = this.vinculos[String(discId)] || [];

        const elegiveis = this._professoresElegiveisParaTurma(profs, turma.id);
        const profsDisponiveis = elegiveis.filter((p) => {
          const disp = this.disponibilidades[p.id];
          if (!disp) return true;

          const turmasAtendidas = disp.turmas_atendidas || [];
          if (
            turmasAtendidas.length > 0 &&
            !turmasAtendidas.includes(turma.id)
          ) {
            return false;
          }
          return true;
        });

        demandas.push({
          turmaId: turma.id,
          turmaNome: turma.nome,
          disciplinaId: discId,
          disciplinaNome: discNome,
          qtd: qtd,
          professores: profsDisponiveis,
          professoresVinculados: profs,
          professoresElegiveis: elegiveis,
          professoresDisponiveis: profsDisponiveis,
          alocadas: 0,
        });
      });
    });

    return demandas;
  }

  // ==========================================
  // FASE 1: ALOCAR APENAS COM PROFESSORES PRIMÁRIOS
  // ==========================================

  _alocarApenasPrimarios(demandas) {
    const assignments = [];
    const slotsOcupados = new Set();
    const profTotalContagem = {};

    this.professores.forEach((p) => {
        profTotalContagem[p.id] = 0;
    });

    const horariosPorDia = {};
    this.dias.forEach((dia) => {
        horariosPorDia[dia] = this.horarios.filter((h) => h.dia_semana === dia);
    });

    let totalAlocadas = 0;

    // ==========================================
    // Agrupa demandas por professor
    // ==========================================
    const demandasPorProfessor = {};
    for (const demanda of demandas) {
        const primario = this._obterProfessorPrimario(demanda.turmaId, demanda.disciplinaId);
        if (!primario) continue;
        const key = `${primario.id}|${demanda.disciplinaId}`;
        if (!demandasPorProfessor[key]) {
            demandasPorProfessor[key] = {
                professor: primario,
                disciplinaId: demanda.disciplinaId,
                demandas: []
            };
        }
        demandasPorProfessor[key].demandas.push(demanda);
    }

    // ==========================================
    // Processa professores com MENOS carga PRIMEIRO
    // ==========================================
    const professoresOrdenados = Object.values(demandasPorProfessor).sort((a, b) => {
        const totalAulasA = a.demandas.reduce((s, d) => s + d.qtd, 0);
        const totalAulasB = b.demandas.reduce((s, d) => s + d.qtd, 0);
        return totalAulasA - totalAulasB;
    });

    for (const grupo of professoresOrdenados) {
        const primario = grupo.professor;
        
        // Ordena as demandas deste professor
        const demandasOrdenadas = [...grupo.demandas].sort((a, b) => b.qtd - a.qtd);

        for (const demanda of demandasOrdenadas) {
            const cargaAtualProf = assignments.filter(
                (a) => Number(a.professor_id) === Number(primario.id),
            ).length;
            const cargaNecessaria = demanda.qtd;
            const cargaDisponivel = this.maxCargaProfessor - cargaAtualProf;

            if (cargaDisponivel < cargaNecessaria) {
                this._log(
                    `   ⚠️ Professor ${primario.nome} sem carga suficiente (disponível: ${cargaDisponivel}, necessário: ${cargaNecessaria})`,
                );
                continue;
            }

            let alocadas = 0;

            for (let aula = 0; aula < demanda.qtd; aula++) {
                let melhorSlot = null;
                let melhorScore = -Infinity;

                const aulasJaAlocadas = assignments.filter(
                    (a) =>
                        Number(a.turma_id) === Number(demanda.turmaId) &&
                        Number(a.disciplina_id) === Number(demanda.disciplinaId),
                ).length;
                const aulasRestantes = demanda.qtd - aulasJaAlocadas;

                for (const dia of this.dias) {
                    const horariosDoDia = horariosPorDia[dia] || [];

                    for (const horario of horariosDoDia) {
                        if (!this._horarioPermitidoTurma(demanda.turmaId, horario.id))
                            continue;

                        const chave = `${demanda.turmaId}|${dia}|${horario.id}`;
                        if (slotsOcupados.has(chave)) continue;

                        // ==========================================
                        // CORREÇÃO: ignorarDisponibilidade = true
                        // ==========================================
                        if (
                            !this._podeAlocarComProfessor(
                                assignments,
                                demanda.turmaId,
                                demanda.disciplinaId,
                                primario.id,
                                dia,
                                horario.id,
                                null,
                                false,
                                true,
                                false,  // <--- IGNORA DISPONIBILIDADE
                            )
                        )
                            continue;

                        let score = 0;

                        // Urgência: quanto mais aulas faltam, maior a prioridade
                        score += aulasRestantes * 10000;

                        // Preferir concentrar a carga do professor sem relaxar limites diários.
                        const aulasProfDia = assignments.filter(
                            (a) =>
                                Number(a.professor_id) === Number(primario.id) &&
                                a.dia_semana === dia,
                        ).length;
                        score += Math.min(aulasProfDia, 3) * 2500;

                        // Preferir dias com menos aulas da turma
                        const aulasTurmaDia = assignments.filter(
                            (a) =>
                                Number(a.turma_id) === Number(demanda.turmaId) &&
                                a.dia_semana === dia,
                        ).length;
                        score -= aulasTurmaDia * 1000;

                        // Preferir horários adjacentes às aulas já atribuídas ao professor.
                        const periodosOrdenados = horariosDoDia.slice().sort(
                            (a, b) => String(a.hora_inicio).localeCompare(String(b.hora_inicio)),
                        );
                        const ordemAtual = periodosOrdenados.findIndex(
                            (item) => Number(item.id) === Number(horario.id),
                        );
                        const temAulaConsecutivaDoProfessor = ordemAtual >= 0 && assignments.some((a) => {
                            if (Number(a.professor_id) !== Number(primario.id) || a.dia_semana !== dia) return false;
                            const ordemExistente = periodosOrdenados.findIndex(
                                (item) => Number(item.id) === Number(a.horario_id),
                            );
                            return ordemExistente >= 0 && Math.abs(ordemExistente - ordemAtual) === 1;
                        });
                        if (temAulaConsecutivaDoProfessor) score += 6500;

                        // Distribuir ao longo da semana
                        const diasComAula = new Set();
                        assignments
                            .filter(
                                (a) =>
                                    Number(a.turma_id) === Number(demanda.turmaId) &&
                                    Number(a.disciplina_id) === Number(demanda.disciplinaId),
                            )
                            .forEach((a) => diasComAula.add(a.dia_semana));

                        if (diasComAula.size < 3 && aulasJaAlocadas > 0) {
                            score += 1000;
                        }

                        score += Math.random() * 0.1;

                        if (score > melhorScore) {
                            melhorScore = score;
                            melhorSlot = {
                                dia: dia,
                                horarioId: horario.id,
                                horario: horario,
                                professorId: primario.id,
                            };
                        }
                    }
                }

                if (melhorSlot) {
                    const assignment = {
                        id:
                            "qdp_" +
                            Date.now() +
                            "_" +
                            Math.random().toString(36).substr(2, 6) +
                            "_" +
                            assignments.length,
                        turma_id: Number(demanda.turmaId),
                        turma_nome: demanda.turmaNome,
                        horario_id: Number(melhorSlot.horarioId),
                        dia_semana: melhorSlot.dia,
                        disciplina_id: Number(demanda.disciplinaId),
                        disciplina_nome: demanda.disciplinaNome,
                        professor_id: Number(melhorSlot.professorId),
                        professor_nome: this._getProfessorNome(melhorSlot.professorId),
                    };

                    assignments.push(assignment);
                    slotsOcupados.add(
                        `${demanda.turmaId}|${melhorSlot.dia}|${melhorSlot.horarioId}`,
                    );
                    profTotalContagem[melhorSlot.professorId] =
                        (profTotalContagem[melhorSlot.professorId] || 0) + 1;
                    alocadas++;
                    totalAlocadas++;
                } else {
                    // ==========================================
                    // Tenta FORÇAR com relaxarLimiteDia = true
                    // ==========================================
                    let forcarSlot = null;
                    for (const dia of this.dias) {
                        const horariosDoDia = horariosPorDia[dia] || [];
                        for (const horario of horariosDoDia) {
                            if (!this._horarioPermitidoTurma(demanda.turmaId, horario.id))
                                continue;

                            const chave = `${demanda.turmaId}|${dia}|${horario.id}`;
                            if (slotsOcupados.has(chave)) continue;

                            if (
                                this._podeAlocarComProfessor(
                                    assignments,
                                    demanda.turmaId,
                                    demanda.disciplinaId,
                                    primario.id,
                                    dia,
                                    horario.id,
                                    null,
                                    true,
                                    true,
                                    false,  // <--- IGNORA DISPONIBILIDADE
                                )
                            ) {
                                const cargaProf = this._getCargaProfessor(
                                    assignments,
                                    primario.id,
                                );
                                if (cargaProf < this.maxCargaProfessor) {
                                    forcarSlot = { dia, horarioId: horario.id };
                                    break;
                                }
                            }
                        }
                        if (forcarSlot) break;
                    }

                    if (forcarSlot) {
                        const assignment = {
                            id:
                                "qdp_forcado_" +
                                Date.now() +
                                "_" +
                                Math.random().toString(36).substr(2, 6) +
                                "_" +
                                assignments.length,
                            turma_id: Number(demanda.turmaId),
                            turma_nome: demanda.turmaNome,
                            horario_id: Number(forcarSlot.horarioId),
                            dia_semana: forcarSlot.dia,
                            disciplina_id: Number(demanda.disciplinaId),
                            disciplina_nome: demanda.disciplinaNome,
                            professor_id: Number(primario.id),
                            professor_nome: this._getProfessorNome(primario.id),
                        };

                        assignments.push(assignment);
                        slotsOcupados.add(
                            `${demanda.turmaId}|${forcarSlot.dia}|${forcarSlot.horarioId}`,
                        );
                        profTotalContagem[primario.id] =
                            (profTotalContagem[primario.id] || 0) + 1;
                        alocadas++;
                        totalAlocadas++;
                    } else {
                        this._log(
                            `   ⚠️ Não foi possível alocar aula ${aula + 1}/${demanda.qtd} de ${demanda.disciplinaNome} na ${demanda.turmaNome} para ${primario.nome}`,
                        );
                    }
                }
            }

            demanda.alocadas = alocadas;
            if (alocadas < demanda.qtd) {
                this._log(
                    `   ⚠️ ${demanda.disciplinaNome} na ${demanda.turmaNome}: alocadas ${alocadas}/${demanda.qtd} (${demanda.qtd - alocadas} pendentes)`,
                );
            }
        }
    }

    this._log(`   FASE 1: ${totalAlocadas} aulas alocadas`);
    return assignments;
}

  // ==========================================
  // FASE 2: FALLBACK
  // ==========================================

  _alocarFallback(assignments, demandas) {
    const slotsOcupados = new Set();
    assignments.forEach((a) => {
        slotsOcupados.add(`${a.turma_id}|${a.dia_semana}|${a.horario_id}`);
    });

    const horariosPorDia = {};
    this.dias.forEach((dia) => {
        horariosPorDia[dia] = this.horarios.filter((h) => h.dia_semana === dia);
    });

    let fallbackAlocadas = 0;

    for (const demanda of demandas) {
        const alocadasAtuais = assignments.filter(
            (a) =>
                Number(a.turma_id) === Number(demanda.turmaId) &&
                Number(a.disciplina_id) === Number(demanda.disciplinaId),
        ).length;

        const faltam = demanda.qtd - alocadasAtuais;
        if (faltam <= 0) continue;

        this._log(
            `   FALLBACK: ${faltam} aulas de ${demanda.disciplinaNome} na ${demanda.turmaNome}`,
        );

        const primario = this._obterProfessorPrimario(
            demanda.turmaId,
            demanda.disciplinaId,
        );

        // ==========================================
        // CORREÇÃO: Só permite professores que JÁ ESTÃO na turma
        // ou o professor primário
        // ==========================================
        const profsPermitidos = [...demanda.professores].filter((prof) => {
            // Se for o primário, permite
            if (primario && Number(prof.id) === Number(primario.id)) return true;
            
            // Verifica se este professor JÁ TEM alguma aula nesta turma
            const jaTemAulaNestaTurma = assignments.some(a =>
                Number(a.turma_id) === Number(demanda.turmaId) &&
                Number(a.professor_id) === Number(prof.id)
            );
            
            // Só permite se já tiver aula na turma (ou for o primário)
            return jaTemAulaNestaTurma;
        });

        const profsOrdenados = [...profsPermitidos].sort((a, b) => {
            if (primario && Number(a.id) === Number(primario.id)) return -1;
            if (primario && Number(b.id) === Number(primario.id)) return 1;
            const cargaA = this._getCargaProfessor(assignments, a.id);
            const cargaB = this._getCargaProfessor(assignments, b.id);
            return cargaA - cargaB;
        });

        // Se não houver professores permitidos, usa o primário
        if (profsOrdenados.length === 0 && primario) {
            profsOrdenados.push(primario);
        }

        for (let aula = 0; aula < faltam; aula++) {
            let slotEncontrado = null;

            for (const dia of this.dias) {
                const horariosDoDia = horariosPorDia[dia] || [];

                for (const horario of horariosDoDia) {
                    if (!this._horarioPermitidoTurma(demanda.turmaId, horario.id))
                        continue;

                    const chave = `${demanda.turmaId}|${dia}|${horario.id}`;
                    if (slotsOcupados.has(chave)) continue;

                    if (
                        assignments.some(
                            (a) =>
                                a.turma_id === demanda.turmaId &&
                                a.dia_semana === dia &&
                                a.horario_id === horario.id,
                        )
                    )
                        continue;

                    if (
                        assignments.filter(
                            (a) =>
                                Number(a.turma_id) === Number(demanda.turmaId) &&
                                Number(a.disciplina_id) === Number(demanda.disciplinaId) &&
                                a.dia_semana === dia,
                        ).length >= 3
                    )
                        continue;

                    if (
                        !this._verificarRestricaoDisciplina(
                            demanda.disciplinaId,
                            dia,
                            horario.id,
                        )
                    )
                        continue;

                    for (const prof of profsOrdenados) {
                        if (!this._professorDisponivel(prof.id, dia, horario.id))
                            continue;

                        if (
                            assignments.some(
                                (a) =>
                                    Number(a.professor_id) === Number(prof.id) &&
                                    a.dia_semana === dia &&
                                    Number(a.horario_id) === Number(horario.id),
                            )
                        )
                            continue;

                        if (
                            assignments.filter(
                                (a) =>
                                    Number(a.professor_id) === Number(prof.id) &&
                                    a.dia_semana === dia,
                            ).length >= this._limiteProfessorDia(prof.id)
                        )
                            continue;

                        if (
                            this._getCargaProfessor(assignments, prof.id) >=
                            this.maxCargaProfessor
                        )
                            continue;

                        slotEncontrado = { dia, horarioId: horario.id, professor: prof };
                        break;
                    }

                    if (slotEncontrado) break;
                }
                if (slotEncontrado) break;
            }

            if (slotEncontrado) {
                const assignment = {
                    id:
                        "qdp_fallback_" +
                        Date.now() +
                        "_" +
                        Math.random().toString(36).substr(2, 6) +
                        "_" +
                        assignments.length,
                    turma_id: Number(demanda.turmaId),
                    turma_nome: demanda.turmaNome,
                    horario_id: Number(slotEncontrado.horarioId),
                    dia_semana: slotEncontrado.dia,
                    disciplina_id: Number(demanda.disciplinaId),
                    disciplina_nome: demanda.disciplinaNome,
                    professor_id: Number(slotEncontrado.professor.id),
                    professor_nome: slotEncontrado.professor.nome,
                };

                assignments.push(assignment);
                slotsOcupados.add(
                    `${demanda.turmaId}|${slotEncontrado.dia}|${slotEncontrado.horarioId}`,
                );
                fallbackAlocadas++;
            }
        }
    }

    if (fallbackAlocadas > 0) {
        this._log(`   FASE 2: +${fallbackAlocadas} aulas alocadas via fallback`);
    }

    return assignments;
}

  // ==========================================
  // FASE 3: ALGORITMO DE REPARO
  // ==========================================

  _repararPendencias(assignments, demandas) {
    const horariosOrdenados = this._ordenarHorarios();
    let reparos = 0;
    let iteracao = 0;
    const maxIteracoes = 100;

    while (iteracao < maxIteracoes) {
      iteracao++;

      const pendencias = [];
      for (const demanda of demandas) {
        const alocadas = assignments.filter(
          (a) =>
            Number(a.turma_id) === Number(demanda.turmaId) &&
            Number(a.disciplina_id) === Number(demanda.disciplinaId),
        ).length;
        const faltam = demanda.qtd - alocadas;
        if (faltam > 0) {
          pendencias.push({ demanda, faltam });
        }
      }

      if (pendencias.length === 0) {
        this._log(
          `   REPARO: Todas as pendências resolvidas em ${iteracao} iterações`,
        );
        break;
      }

      let resolveu = false;

      for (const pendencia of pendencias) {
        const demanda = pendencia.demanda;
        const primario = this._obterProfessorPrimario(
          demanda.turmaId,
          demanda.disciplinaId,
        );

        if (!primario) continue;

        for (let a = 0; a < pendencia.faltam; a++) {
          const aulasTurma = assignments.filter(
            (a) => Number(a.turma_id) === Number(demanda.turmaId),
          );
          const slotsLivres = horariosOrdenados.filter(
            (h) =>
              !aulasTurma.some(
                (a) =>
                  a.dia_semana === h.dia_semana &&
                  Number(a.horario_id) === Number(h.id),
              ),
          );

          let alocado = false;
          for (const slot of slotsLivres) {
            if (
              this._podeAlocarComProfessor(
                assignments,
                demanda.turmaId,
                demanda.disciplinaId,
                primario.id,
                slot.dia_semana,
                slot.id,
                null,
                false,
                false,
              )
            ) {
              assignments.push({
                id:
                  "qdp_reparo_" +
                  Date.now() +
                  "_" +
                  Math.random().toString(36).substr(2, 6) +
                  "_" +
                  assignments.length,
                turma_id: Number(demanda.turmaId),
                turma_nome: demanda.turmaNome,
                horario_id: Number(slot.id),
                dia_semana: slot.dia_semana,
                disciplina_id: Number(demanda.disciplinaId),
                disciplina_nome: demanda.disciplinaNome,
                professor_id: Number(primario.id),
                professor_nome: this._getProfessorNome(primario.id),
              });
              reparos++;
              alocado = true;
              resolveu = true;
              break;
            }
          }

          if (alocado) continue;

          let movido = false;
          for (const aulaExistente of aulasTurma) {
            const slotsAlternativos = horariosOrdenados.filter(
              (h) =>
                h.dia_semana !== aulaExistente.dia_semana ||
                Number(h.id) !== Number(aulaExistente.horario_id),
            );

            for (const slotAlt of slotsAlternativos) {
              if (
                this._podeAlocarComProfessor(
                  assignments,
                  aulaExistente.turma_id,
                  aulaExistente.disciplina_id,
                  aulaExistente.professor_id,
                  slotAlt.dia_semana,
                  slotAlt.id,
                  aulaExistente.id,
                  false,
                  false,
                )
              ) {
                const oldDia = aulaExistente.dia_semana;
                const oldHorario = aulaExistente.horario_id;

                aulaExistente.dia_semana = slotAlt.dia_semana;
                aulaExistente.horario_id = Number(slotAlt.id);

                if (
                  this._podeAlocarComProfessor(
                    assignments,
                    demanda.turmaId,
                    demanda.disciplinaId,
                    primario.id,
                    oldDia,
                    oldHorario,
                    null,
                    false,
                    false,
                  )
                ) {
                  assignments.push({
                    id:
                      "qdp_reparo_" +
                      Date.now() +
                      "_" +
                      Math.random().toString(36).substr(2, 6) +
                      "_" +
                      assignments.length,
                    turma_id: Number(demanda.turmaId),
                    turma_nome: demanda.turmaNome,
                    horario_id: Number(oldHorario),
                    dia_semana: oldDia,
                    disciplina_id: Number(demanda.disciplinaId),
                    disciplina_nome: demanda.disciplinaNome,
                    professor_id: Number(primario.id),
                    professor_nome: this._getProfessorNome(primario.id),
                  });
                  reparos++;
                  movido = true;
                  resolveu = true;
                  break;
                } else {
                  aulaExistente.dia_semana = oldDia;
                  aulaExistente.horario_id = Number(oldHorario);
                }
              }
            }
            if (movido) break;
          }

          if (movido) continue;

          for (const aulaExistente of aulasTurma) {
            const demandaExistente = demandas.find(
              (d) =>
                Number(d.turmaId) === Number(aulaExistente.turma_id) &&
                Number(d.disciplinaId) === Number(aulaExistente.disciplina_id),
            );
            if (!demandaExistente) continue;

            const totalDaDisciplina = assignments.filter(
              (a) =>
                Number(a.turma_id) === Number(aulaExistente.turma_id) &&
                Number(a.disciplina_id) === Number(aulaExistente.disciplina_id),
            ).length;

            if (totalDaDisciplina > demandaExistente.qtd) {
              const professorPendencia = this._obterProfessorPrimario(
                demanda.turmaId,
                demanda.disciplinaId,
              );
              if (!professorPendencia) continue;

              if (
                this._podeAlocarComProfessor(
                  assignments,
                  aulaExistente.turma_id,
                  demanda.disciplinaId,
                  professorPendencia.id,
                  aulaExistente.dia_semana,
                  aulaExistente.horario_id,
                  aulaExistente.id,
                  false,
                  false,
                )
              ) {
                const disciplinaAntiga = aulaExistente.disciplina_nome;
                aulaExistente.disciplina_id = Number(demanda.disciplinaId);
                aulaExistente.disciplina_nome = demanda.disciplinaNome;
                aulaExistente.professor_id = Number(professorPendencia.id);
                aulaExistente.professor_nome = this._getProfessorNome(
                  professorPendencia.id,
                );

                reparos++;
                resolveu = true;
                break;
              }
            }
          }
        }
      }

      if (!resolveu) {
        for (const pendencia of pendencias) {
          const demanda = pendencia.demanda;
          const primario = this._obterProfessorPrimario(
            demanda.turmaId,
            demanda.disciplinaId,
          );
          if (!primario) continue;

          const aulasTurma = assignments.filter(
            (a) => Number(a.turma_id) === Number(demanda.turmaId),
          );

          for (const aulaExistente of aulasTurma) {
            if (
              Number(aulaExistente.disciplina_id) ===
              Number(demanda.disciplinaId)
            )
              continue;

            if (
              this._podeAlocarComProfessor(
                assignments,
                aulaExistente.turma_id,
                demanda.disciplinaId,
                primario.id,
                aulaExistente.dia_semana,
                aulaExistente.horario_id,
                aulaExistente.id,
                false,
                false,
              )
            ) {
              aulaExistente.disciplina_id = Number(demanda.disciplinaId);
              aulaExistente.disciplina_nome = demanda.disciplinaNome;
              aulaExistente.professor_id = Number(primario.id);
              aulaExistente.professor_nome = this._getProfessorNome(
                primario.id,
              );

              reparos++;
              resolveu = true;
              break;
            }
          }
          if (resolveu) break;
        }
      }

      if (!resolveu) {
        break;
      }
    }

    if (reparos > 0) {
      this._log(`   REPARO: ${reparos} aula(s) reparadas`);
    }

    return assignments;
  }

  // ==========================================
  // FASE 4: ESCALONAMENTO DE CARGA
  // ==========================================

  _escalonarCarga(assignments, demandas) {
    this._log("   🔄 Iniciando escalonamento de carga...");
    let escalonados = 0;

    const porDisciplina = {};
    for (const demanda of demandas) {
      const discId = demanda.disciplinaId;
      if (!porDisciplina[discId]) {
        porDisciplina[discId] = {
          demanda: demanda,
          assignments: [],
        };
      }
    }

    for (const a of assignments) {
      const discId = a.disciplina_id;
      if (porDisciplina[discId]) {
        porDisciplina[discId].assignments.push(a);
      }
    }

    for (const [discId, data] of Object.entries(porDisciplina)) {
      const discAssignments = data.assignments;
      if (discAssignments.length < 2) continue;

      const cargaPorProf = {};
      for (const a of discAssignments) {
        const pid = a.professor_id;
        if (!cargaPorProf[pid]) cargaPorProf[pid] = 0;
        cargaPorProf[pid]++;
      }

      let precisaEscalonar = false;
      for (const [pid, carga] of Object.entries(cargaPorProf)) {
        if (carga > this.maxCargaProfessor) {
          precisaEscalonar = true;
          this._log(
            `   🔄 Professor ${this._getProfessorNome(pid)} excedeu o limite (${carga}/${this.maxCargaProfessor})`,
          );
          break;
        }
      }

      if (!precisaEscalonar) continue;

      const profsOrdenados = Object.entries(cargaPorProf).sort(
        (a, b) => b[1] - a[1],
      );

      for (const [profIdSobrecarga, cargaAtual] of profsOrdenados) {
        if (cargaAtual <= this.maxCargaProfessor) continue;

        const profsDaDisciplina = this.vinculos[discId] || [];
        const aulasParaTransferir = assignments.filter(
          (a) =>
            Number(a.professor_id) === Number(profIdSobrecarga) &&
            String(a.disciplina_id) === String(discId),
        );

        for (const aula of aulasParaTransferir) {
          if (
            this._getCargaProfessor(assignments, profIdSobrecarga) <=
            this.maxCargaProfessor
          )
            break;

          const elegiveis = this._professoresElegiveisParaTurma(profsDaDisciplina, aula.turma_id)
            .filter((professor) => Number(professor.id) !== Number(profIdSobrecarga))
            .sort((a, b) => this._getCargaProfessor(assignments, a.id) - this._getCargaProfessor(assignments, b.id));
          const melhorDestino = elegiveis.find((professor) =>
            this._podeAlocarComProfessor(
              assignments,
              aula.turma_id,
              aula.disciplina_id,
              professor.id,
              aula.dia_semana,
              aula.horario_id,
              aula.id,
              false,
              false,
            ),
          );
          if (melhorDestino) {
            aula.professor_id = Number(melhorDestino.id);
            aula.professor_nome = melhorDestino.nome;
            escalonados++;
          }
        }
      }
    }

    if (escalonados > 0) {
      this._log(`   ESCALONAMENTO: ${escalonados} aula(s) transferidas`);
    }

    return assignments;
  }

  // ==========================================
  // FASE 5: REPOSICIONAMENTO INTELIGENTE
  // ==========================================

  _reposicionarParaCompletar(assignments, demandas) {
    this._log("   🔄 Reposicionando aulas para completar turmas...");
    let reposicionados = 0;
    const horariosOrdenados = this._ordenarHorarios();

    const turmasComPendencia = [];
    for (const turma of this.turmas) {
      const totalPrevisto = demandas
        .filter((d) => d.turmaId === turma.id)
        .reduce((s, d) => s + d.qtd, 0);
      const totalAlocado = assignments.filter(
        (a) => a.turma_id === turma.id,
      ).length;
      if (totalAlocado < totalPrevisto) {
        turmasComPendencia.push({
          turma,
          faltam: totalPrevisto - totalAlocado,
        });
      }
    }

    if (turmasComPendencia.length === 0) {
      this._log("   REPOSICIONAMENTO: Nenhuma turma com pendência");
      return assignments;
    }

    this._log(
      `   REPOSICIONAMENTO: ${turmasComPendencia.length} turma(s) com pendências`,
    );

    for (const item of turmasComPendencia) {
      const turma = item.turma;

      const pendencias = demandas.filter(
        (d) =>
          d.turmaId === turma.id &&
          assignments.filter(
            (a) =>
              a.turma_id === turma.id && a.disciplina_id === d.disciplinaId,
          ).length < d.qtd,
      );

      for (const pendencia of pendencias) {
        const alocadas = assignments.filter(
          (a) =>
            a.turma_id === turma.id &&
            a.disciplina_id === pendencia.disciplinaId,
        ).length;
        const qtdFaltando = pendencia.qtd - alocadas;

        if (qtdFaltando <= 0) continue;

        const primario = this._obterProfessorPrimario(
          turma.id,
          pendencia.disciplinaId,
        );
        if (!primario) continue;

        if (
          this._getCargaProfessor(assignments, primario.id) >=
          this.maxCargaProfessor
        ) {
          this._log(
            `   ⚠️ Professor ${primario.nome} no limite, não pode completar ${pendencia.disciplinaNome}`,
          );
          continue;
        }

        for (let i = 0; i < qtdFaltando; i++) {
          const aulasTurma = assignments.filter((a) => a.turma_id === turma.id);
          let reposicionado = false;

          for (const aulaExistente of aulasTurma) {
            if (aulaExistente.disciplina_id === pendencia.disciplinaId)
              continue;

            const totalDisciplina = assignments.filter(
              (a) =>
                a.turma_id === turma.id &&
                a.disciplina_id === aulaExistente.disciplina_id,
            ).length;
            const demandaDisciplina = demandas.find(
              (d) =>
                d.turmaId === turma.id &&
                d.disciplinaId === aulaExistente.disciplina_id,
            );

            if (!demandaDisciplina) continue;
            if (totalDisciplina <= demandaDisciplina.qtd) continue;

            const slotsLivres = horariosOrdenados.filter(
              (h) =>
                !aulasTurma.some(
                  (a) => a.dia_semana === h.dia_semana && a.horario_id === h.id,
                ),
            );

            for (const slotLivre of slotsLivres) {
              if (
                this._podeAlocarComProfessor(
                  assignments,
                  aulaExistente.turma_id,
                  aulaExistente.disciplina_id,
                  aulaExistente.professor_id,
                  slotLivre.dia_semana,
                  slotLivre.id,
                  aulaExistente.id,
                  false,
                  false,
                )
              ) {
                const oldDia = aulaExistente.dia_semana;
                const oldHorario = aulaExistente.horario_id;

                aulaExistente.dia_semana = slotLivre.dia_semana;
                aulaExistente.horario_id = Number(slotLivre.id);

                if (
                  this._podeAlocarComProfessor(
                    assignments,
                    turma.id,
                    pendencia.disciplinaId,
                    primario.id,
                    oldDia,
                    oldHorario,
                    null,
                    false,
                    false,
                  )
                ) {
                  assignments.push({
                    id:
                      "qdp_reposicao_" +
                      Date.now() +
                      "_" +
                      Math.random().toString(36).substr(2, 6) +
                      "_" +
                      assignments.length,
                    turma_id: Number(turma.id),
                    turma_nome: turma.nome,
                    horario_id: Number(oldHorario),
                    dia_semana: oldDia,
                    disciplina_id: Number(pendencia.disciplinaId),
                    disciplina_nome: pendencia.disciplinaNome,
                    professor_id: Number(primario.id),
                    professor_nome: primario.nome,
                  });
                  reposicionados++;
                  reposicionado = true;
                  break;
                } else {
                  aulaExistente.dia_semana = oldDia;
                  aulaExistente.horario_id = Number(oldHorario);
                }
              }
            }

            if (reposicionado) break;
          }

          if (!reposicionado) {
            for (const aulaExistente of aulasTurma) {
              if (aulaExistente.disciplina_id === pendencia.disciplinaId)
                continue;

              const totalDisciplina = assignments.filter(
                (a) =>
                  a.turma_id === turma.id &&
                  a.disciplina_id === aulaExistente.disciplina_id,
              ).length;
              const demandaDisciplina = demandas.find(
                (d) =>
                  d.turmaId === turma.id &&
                  d.disciplinaId === aulaExistente.disciplina_id,
              );

              if (!demandaDisciplina) continue;
              if (totalDisciplina <= demandaDisciplina.qtd) continue;

              if (
                this._podeAlocarComProfessor(
                  assignments,
                  aulaExistente.turma_id,
                  pendencia.disciplinaId,
                  primario.id,
                  aulaExistente.dia_semana,
                  aulaExistente.horario_id,
                  aulaExistente.id,
                  false,
                  false,
                )
              ) {
                aulaExistente.disciplina_id = Number(pendencia.disciplinaId);
                aulaExistente.disciplina_nome = pendencia.disciplinaNome;
                aulaExistente.professor_id = Number(primario.id);
                aulaExistente.professor_nome = primario.nome;
                reposicionados++;
                break;
              }
            }
          }
        }
      }
    }

    if (reposicionados > 0) {
      this._log(
        `   REPOSICIONAMENTO: ${reposicionados} aula(s) reposicionadas`,
      );
    }

    return assignments;
  }

  // ==========================================
  // FASE 6: ÚLTIMO RECURSO - 3 AULAS NO DIA
  // ==========================================

  _forcarComTresAulas(assignments, demandas) {
    this._log(
      "   🔄 ÚLTIMO RECURSO: permitindo 3 aulas da mesma disciplina no dia",
    );
    let alocadas = 0;
    const horariosOrdenados = this._ordenarHorarios();

    const pendencias = [];
    for (const demanda of demandas) {
      const alocadasAtuais = assignments.filter(
        (a) =>
          Number(a.turma_id) === Number(demanda.turmaId) &&
          Number(a.disciplina_id) === Number(demanda.disciplinaId),
      ).length;
      const faltam = demanda.qtd - alocadasAtuais;
      if (faltam > 0) {
        pendencias.push({ demanda, faltam });
      }
    }

    if (pendencias.length === 0) {
      this._log("   FORÇAR 3 AULAS: Nenhuma pendência");
      return assignments;
    }

    this._log(
      `   FORÇAR 3 AULAS: ${pendencias.length} pendências (${pendencias.reduce((s, p) => s + p.faltam, 0)} aulas)`,
    );

    for (const pendencia of pendencias) {
      const demanda = pendencia.demanda;
      const primario = this._obterProfessorPrimario(
        demanda.turmaId,
        demanda.disciplinaId,
      );

      if (!primario) continue;

      if (
        this._getCargaProfessor(assignments, primario.id) >=
        this.maxCargaProfessor
      ) {
        this._log(`   ⚠️ Professor ${primario.nome} no limite`);
        continue;
      }

      for (let i = 0; i < pendencia.faltam; i++) {
        const aulasTurma = assignments.filter(
          (a) => Number(a.turma_id) === Number(demanda.turmaId),
        );
        let slotEncontrado = null;

        for (const dia of this.dias) {
          const horariosDoDia = horariosOrdenados.filter(
            (h) => h.dia_semana === dia,
          );

          for (const horario of horariosDoDia) {
            if (!this._horarioPermitidoTurma(demanda.turmaId, horario.id))
              continue;

            if (
              assignments.some(
                (a) =>
                  a.turma_id === demanda.turmaId &&
                  a.dia_semana === dia &&
                  a.horario_id === horario.id,
              )
            )
              continue;

            if (
              this._podeAlocarComProfessor(
                assignments,
                demanda.turmaId,
                demanda.disciplinaId,
                primario.id,
                dia,
                horario.id,
                null,
                true, // relaxarLimiteDia = true (permite 3 por dia)
                false, // permitirTres = false
                true,
              )
            ) {
              slotEncontrado = { dia, horarioId: horario.id };
              break;
            }
          }
          if (slotEncontrado) break;
        }

        if (slotEncontrado) {
          const assignment = {
            id:
              "qdp_tres_" +
              Date.now() +
              "_" +
              Math.random().toString(36).substr(2, 6) +
              "_" +
              assignments.length,
            turma_id: Number(demanda.turmaId),
            turma_nome: demanda.turmaNome,
            horario_id: Number(slotEncontrado.horarioId),
            dia_semana: slotEncontrado.dia,
            disciplina_id: Number(demanda.disciplinaId),
            disciplina_nome: demanda.disciplinaNome,
            professor_id: Number(primario.id),
            professor_nome: primario.nome,
          };

          assignments.push(assignment);
          alocadas++;
        }
      }
    }

    if (alocadas > 0) {
      this._log(`   FORÇAR 3 AULAS: ${alocadas} aula(s) alocadas`);
    }

    return assignments;
  }

  // ==========================================
  // FASE 7: REPOSICIONAMENTO FORÇADO
  // ==========================================

  _reposicionamentoForcado(assignments, demandas) {
    this._log(
      "   🔄 REPOSICIONAMENTO FORÇADO: movendo QUALQUER aula para completar",
    );
    let reposicionados = 0;
    const horariosOrdenados = this._ordenarHorarios();

    const pendencias = [];
    for (const demanda of demandas) {
      const alocadasAtuais = assignments.filter(
        (a) =>
          Number(a.turma_id) === Number(demanda.turmaId) &&
          Number(a.disciplina_id) === Number(demanda.disciplinaId),
      ).length;
      const faltam = demanda.qtd - alocadasAtuais;
      if (faltam > 0) {
        pendencias.push({ demanda, faltam });
      }
    }

    if (pendencias.length === 0) {
      this._log("   REPOSICIONAMENTO FORÇADO: Nenhuma pendência");
      return assignments;
    }

    this._log(`   REPOSICIONAMENTO FORÇADO: ${pendencias.length} pendências`);

    for (const pendencia of pendencias) {
      const demanda = pendencia.demanda;
      const primario = this._obterProfessorPrimario(
        demanda.turmaId,
        demanda.disciplinaId,
      );

      if (!primario) continue;
      if (
        this._getCargaProfessor(assignments, primario.id) >=
        this.maxCargaProfessor
      )
        continue;

      for (let i = 0; i < pendencia.faltam; i++) {
        const aulasTurma = assignments.filter(
          (a) => Number(a.turma_id) === Number(demanda.turmaId),
        );
        let encontrado = false;

        for (const dia of this.dias) {
          const horariosDoDia = horariosOrdenados.filter(
            (h) => h.dia_semana === dia,
          );

          for (const horario of horariosDoDia) {
            if (!this._horarioPermitidoTurma(demanda.turmaId, horario.id))
              continue;

            const aulaExistente = assignments.find(
              (a) =>
                a.turma_id === demanda.turmaId &&
                a.dia_semana === dia &&
                a.horario_id === horario.id,
            );

            if (!aulaExistente) {
              if (
                this._podeAlocarComProfessor(
                  assignments,
                  demanda.turmaId,
                  demanda.disciplinaId,
                  primario.id,
                  dia,
                  horario.id,
                  null,
                  true,
                  false,
                )
              ) {
                assignments.push({
                  id:
                    "qdp_forcado_" +
                    Date.now() +
                    "_" +
                    Math.random().toString(36).substr(2, 6) +
                    "_" +
                    assignments.length,
                  turma_id: Number(demanda.turmaId),
                  turma_nome: demanda.turmaNome,
                  horario_id: Number(horario.id),
                  dia_semana: dia,
                  disciplina_id: Number(demanda.disciplinaId),
                  disciplina_nome: demanda.disciplinaNome,
                  professor_id: Number(primario.id),
                  professor_nome: primario.nome,
                });
                reposicionados++;
                encontrado = true;
                break;
              }
            } else {
              const slotsAlternativos = horariosOrdenados.filter(
                (h) =>
                  h.dia_semana !== dia || Number(h.id) !== Number(horario.id),
              );

              for (const slotAlt of slotsAlternativos) {
                if (
                  this._podeAlocarComProfessor(
                    assignments,
                    aulaExistente.turma_id,
                    aulaExistente.disciplina_id,
                    aulaExistente.professor_id,
                    slotAlt.dia_semana,
                    slotAlt.id,
                    aulaExistente.id,
                    false,
                    false,
                  )
                ) {
                  const oldDia = aulaExistente.dia_semana;
                  const oldHorario = aulaExistente.horario_id;
                  const oldDisciplina = aulaExistente.disciplina_nome;

                  aulaExistente.dia_semana = slotAlt.dia_semana;
                  aulaExistente.horario_id = Number(slotAlt.id);

                  if (
                    this._podeAlocarComProfessor(
                      assignments,
                      demanda.turmaId,
                      demanda.disciplinaId,
                      primario.id,
                      oldDia,
                      oldHorario,
                      null,
                      true,
                      false,
                    )
                  ) {
                    assignments.push({
                      id:
                        "qdp_forcado_" +
                        Date.now() +
                        "_" +
                        Math.random().toString(36).substr(2, 6) +
                        "_" +
                        assignments.length,
                      turma_id: Number(demanda.turmaId),
                      turma_nome: demanda.turmaNome,
                      horario_id: Number(oldHorario),
                      dia_semana: oldDia,
                      disciplina_id: Number(demanda.disciplinaId),
                      disciplina_nome: demanda.disciplinaNome,
                      professor_id: Number(primario.id),
                      professor_nome: primario.nome,
                    });
                    reposicionados++;
                    encontrado = true;
                    break;
                  } else {
                    aulaExistente.dia_semana = oldDia;
                    aulaExistente.horario_id = Number(oldHorario);
                  }
                }
              }
            }

            if (encontrado) break;
          }
          if (encontrado) break;
        }

        if (!encontrado) {
          for (const aulaExistente of aulasTurma) {
            if (
              Number(aulaExistente.disciplina_id) ===
              Number(demanda.disciplinaId)
            )
              continue;

            if (
              this._podeAlocarComProfessor(
                assignments,
                aulaExistente.turma_id,
                demanda.disciplinaId,
                primario.id,
                aulaExistente.dia_semana,
                aulaExistente.horario_id,
                aulaExistente.id,
                true,
                false,
              )
            ) {
              const oldDisciplina = aulaExistente.disciplina_nome;
              aulaExistente.disciplina_id = Number(demanda.disciplinaId);
              aulaExistente.disciplina_nome = demanda.disciplinaNome;
              aulaExistente.professor_id = Number(primario.id);
              aulaExistente.professor_nome = primario.nome;
              reposicionados++;
              encontrado = true;
              break;
            }
          }
        }
      }
    }

    if (reposicionados > 0) {
      this._log(
        `   REPOSICIONAMENTO FORÇADO: ${reposicionados} aula(s) reposicionadas`,
      );
    }

    return assignments;
  }

  // ==========================================
  // FASE 8: FORÇAR PROFESSOR PRIMÁRIO
  // ==========================================

  _forcarProfessorPrimarioFinal(assignments) {
    const modificados = [];
    const porChave = {};

    assignments.forEach((a) => {
      const chave = `${a.turma_id}|${a.disciplina_id}`;
      if (!porChave[chave]) porChave[chave] = [];
      porChave[chave].push(a);
    });

    for (const [chave, aulas] of Object.entries(porChave)) {
      const [turmaId, disciplinaId] = chave.split("|").map(Number);
      const primario = this._obterProfessorPrimario(turmaId, disciplinaId);

      if (!primario) continue;

      const comPrimario = aulas.filter(
        (a) => Number(a.professor_id) === Number(primario.id),
      );
      const semPrimario = aulas.filter(
        (a) => Number(a.professor_id) !== Number(primario.id),
      );

      if (comPrimario.length < aulas.length * 0.8 && semPrimario.length > 0) {
        const turma = this.turmas.find((t) => t.id === turmaId);
        const disc = this.disciplinas.find((d) => d.id === disciplinaId);
        this._log(
          `   🔄 CORRIGINDO ${turma?.nome || turmaId} - ${disc?.nome || disciplinaId}: ${comPrimario.length}/${aulas.length} com primário`,
        );

        for (const aula of semPrimario) {
          const podeTrocar = this._podeAlocarComProfessor(
            assignments,
            aula.turma_id,
            aula.disciplina_id,
            primario.id,
            aula.dia_semana,
            aula.horario_id,
            aula.id,
            true,
            false,
          );
          if (podeTrocar) {
            aula.professor_id = Number(primario.id);
            aula.professor_nome = this._getProfessorNome(primario.id);
            modificados.push(aula.id);
          }
        }
      }
    }

    if (modificados.length > 0) {
      this._log(
        `   FASE 8: ${modificados.length} aula(s) forçadas para o professor primário`,
      );
    }

    return assignments;
  }

  // ==========================================
  // VALIDAÇÃO FINAL
  // ==========================================

  _aplicarValidacaoFinalEstrita(assignments) {
    const resultado = [];
    const profDia = {};
    const slotTurma = new Set();
    const slotProfessor = new Set();
    let removidas = 0;

    for (const a of assignments) {
      const turmaId = Number(a.turma_id);
      const professorId = Number(a.professor_id);
      const horarioId = Number(a.horario_id);
      const dia = String(a.dia_semana || "");

      if (!this._horarioPermitidoTurma(turmaId, horarioId, dia)) {
        removidas++;
        continue;
      }

      const turmaSlotKey = `${turmaId}|${dia}|${horarioId}`;
      if (slotTurma.has(turmaSlotKey)) {
        removidas++;
        continue;
      }

      const profSlotKey = `${professorId}|${dia}|${horarioId}`;
      if (slotProfessor.has(profSlotKey)) {
        removidas++;
        continue;
      }

      if (!profDia[professorId]) profDia[professorId] = {};
      const atualNoDia = Number(profDia[professorId][dia] || 0);
      if (atualNoDia >= this._limiteProfessorDia(professorId)) {
        removidas++;
        continue;
      }

      profDia[professorId][dia] = atualNoDia + 1;
      slotTurma.add(turmaSlotKey);
      slotProfessor.add(profSlotKey);
      resultado.push(a);
    }

    if (removidas > 0) {
      this._log(`   VALIDAÇÃO FINAL: ${removidas} aula(s) removida(s)`);
    }

    return resultado;
  }

  _motivoPendencia(demanda, assignments) {
    const vinculados = demanda.professoresVinculados || this.vinculos[String(demanda.disciplinaId)] || [];
    if (!vinculados.length) return "Não há professor vinculado a esta disciplina neste semestre.";

    const elegiveis = demanda.professoresElegiveis || this._professoresElegiveisParaTurma(vinculados, demanda.turmaId);
    if (!elegiveis.length) {
      return "Os vínculos da disciplina estão restritos a grupos que não incluem esta turma.";
    }

    const disponiveis = demanda.professoresDisponiveis || demanda.professores || [];
    if (!disponiveis.length) {
      return "Nenhum professor elegível tem esta turma incluída nas suas turmas autorizadas de disponibilidade.";
    }

    const horariosPermitidos = this.horarios.filter((horario) =>
      this._horarioPermitidoTurma(demanda.turmaId, horario.id, horario.dia_semana),
    );
    if (!horariosPermitidos.length) {
      return "A turma não tem períodos de aula utilizáveis; verifique horários cadastrados, turno e períodos protegidos.";
    }

    const professoresComHorario = disponiveis.filter((professor) =>
      horariosPermitidos.some((horario) =>
        this._professorDisponivel(professor.id, horario.dia_semana, horario.id),
      ),
    );
    if (!professoresComHorario.length) {
      return "Os professores elegíveis estão indisponíveis em todos os horários permitidos para esta turma.";
    }

    if (professoresComHorario.every((professor) =>
      this._getCargaProfessor(assignments, professor.id) >= this.maxCargaProfessor,
    )) {
      return "Todos os professores elegíveis atingiram o limite máximo de aulas da geração.";
    }

    return "Não foi possível conciliar os horários restantes com a disponibilidade docente e os limites de aulas por horário e por dia.";
  }

  // ==========================================
  // RELATÓRIO
  // ==========================================

  _gerarRelatorio(assignments, demandas) {
    const totalPrevistas = demandas.reduce((acc, d) => acc + d.qtd, 0);
    const totalAtendidas = assignments.length;

    const falhas = [];

    const relatorio = {
      geradoEm: new Date().toLocaleString("pt-BR"),
      metodo: "QDP v" + this.version,
      totalPrevistas,
      totalAtendidas,
      totalPendentes: Math.max(0, totalPrevistas - totalAtendidas),
      totalFalhas: Math.max(0, totalPrevistas - totalAtendidas),
      completo: totalAtendidas === totalPrevistas,
      turmas: [],
      professores: [],
      falhas: falhas,
      logs: this.logs,
    };

    this.turmas.forEach((turma) => {
      const turmaDemandas = demandas.filter((d) => d.turmaId === turma.id);
      const turmaAtribuicoes = assignments.filter(
        (a) => a.turma_id === turma.id,
      );
      const totalTurma = turmaDemandas.reduce((acc, d) => acc + d.qtd, 0);

      const disciplinas = turmaDemandas.map((d) => {
        const alocadas = turmaAtribuicoes.filter(
          (a) => a.disciplina_id === d.disciplinaId,
        ).length;
        const pendentes = Math.max(0, d.qtd - alocadas);
        if (pendentes > 0) {
          falhas.push({
            turma_id: turma.id,
            turma_nome: turma.nome,
            disciplina_id: d.disciplinaId,
            disciplina_nome: d.disciplinaNome,
            previstas: d.qtd,
            atendidas: alocadas,
            pendentes: pendentes,
            motivo: this._motivoPendencia(d, assignments),
            professores: (d.professoresElegiveis || []).map((professor) => ({
              id: Number(professor.id),
              nome: professor.nome || this._getProfessorNome(professor.id),
            })),
          });
        }
        return {
          disciplina_id: d.disciplinaId,
          disciplina_nome: d.disciplinaNome,
          previstas: d.qtd,
          atendidas: alocadas,
          pendentes: pendentes,
        };
      });

      relatorio.turmas.push({
        turma_id: turma.id,
        turma_nome: turma.nome,
        totalPrevistas: totalTurma,
        atendidas: turmaAtribuicoes.length,
        pendentes: Math.max(0, totalTurma - turmaAtribuicoes.length),
        disciplinas: disciplinas,
        completa: turmaAtribuicoes.length === totalTurma,
      });
    });

    this.professores.forEach((prof) => {
      const profAtribuicoes = assignments.filter(
        (a) => a.professor_id === prof.id,
      );
      relatorio.professores.push({
        professor_id: prof.id,
        professor_nome: prof.nome,
        carga_alocada: profAtribuicoes.length,
        carga_total: profAtribuicoes.length,
      });
    });

    return relatorio;
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = QDPEngine;
}
