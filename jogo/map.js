import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://okanxeevvhnmtxlnwlol.supabase.co';
const supabaseKey = 'sb_publishable_aa0b-bcFDprV_NCnKRjcUA_lcquntDY';
const supabase = createClient(supabaseUrl, supabaseKey);

const desafioTexto = document.getElementById('desafioTexto');
const valorPonto = document.getElementById('valorPonto');

const botaoFeito = document.getElementById('botaoFeito');
const botaoRecusar = document.getElementById('botaoRecusar');

const loading = document.getElementById('loading');
const desafioContainer = document.getElementById('desafioContainer');

const playerId = localStorage.getItem('player_id');

const DURACAO_RODADA_MS = 20 * 60 * 1000;
const PONTUACAO_MAXIMA = 100;

let jogadorAtual = null;

let inicioJogo = null;
let fimJogo = null;

let rodadaAtual = null;
let desafioAtualId = null;

let votoRegistrado = false;
let desafioConcluido = false;

let pontuacaoRegistrada = false;

let intervaloVerificacaoPartida = null;
let intervaloVerificacaoRodada = null;
let intervaloVerificacaoVotos = null;

function bloquearBotoes() {

    if (botaoFeito) {
        botaoFeito.disabled = true;
    }

    if (botaoRecusar) {
        botaoRecusar.disabled = true;
    }

}

function liberarBotoes() {

    if (desafioConcluido || votoRegistrado) {
        return;
    }

    if (botaoFeito) {
        botaoFeito.disabled = false;
    }

    if (botaoRecusar) {
        botaoRecusar.disabled = false;
    }

}

function mostrarLoading() {

    if (loading) {
        loading.style.display = 'flex';
    }

    if (desafioContainer) {
        desafioContainer.style.display = 'none';
    }

}

function mostrarMensagem(mensagem) {

    if (loading) {
        loading.style.display = 'none';
    }

    if (desafioContainer) {
        desafioContainer.style.display = 'block';
    }

    if (desafioTexto) {
        desafioTexto.textContent = mensagem;
    }

    if (valorPonto) {
        valorPonto.textContent = '';
    }

}

function mostrarDesafioNaTela(desafio) {

    if (loading) {
        loading.style.display = 'none';
    }

    if (desafioContainer) {
        desafioContainer.style.display = 'block';
    }

    if (desafioTexto) {
        desafioTexto.textContent =
            `${desafio.texto}`;
    }

    if (valorPonto) {
        valorPonto.textContent = '';
    }

}

async function carregarJogador() {

    if (!playerId) {

        console.log(
            'Nenhum player_id encontrado.'
        );

        window.location.href =
            '../cadastro/lobby.html';

        return false;
    }


    const {
        data: jogador,
        error
    } = await supabase
        .from('jogadores')
        .select('id, nome, equipe_id')
        .eq('id', playerId)
        .maybeSingle();


    if (error) {

        console.error(
            'Erro ao buscar jogador:',
            error
        );

        mostrarMensagem(
            '⚠️ Não foi possível carregar seus dados.'
        );

        return false;
    }


    if (!jogador) {

        console.log(
            'Jogador não encontrado no banco.'
        );

        localStorage.removeItem('player_id');
        localStorage.removeItem('equipe_id');

        window.location.href =
            '../cadastro/lobby.html';

        return false;
    }


    jogadorAtual = jogador;


    localStorage.setItem(
        'equipe_id',
        jogador.equipe_id
    );


    console.log('============================');
    console.log('JOGADOR ENCONTRADO');
    console.log('ID:', jogador.id);
    console.log('Nome:', jogador.nome);
    console.log('Equipe ID:', jogador.equipe_id);
    console.log('============================');


    return true;

}

async function carregarPartida() {

    const {
        data,
        error
    } = await supabase
        .from('jogo_status')
        .select(
            'iniciado, inicio_em, fim_em'
        )
        .eq('id', 1)
        .single();


    if (error) {

        console.error(
            'Erro ao buscar status da partida:',
            error
        );

        return false;
    }

    if (!data.iniciado) {

        inicioJogo = null;
        fimJogo = null;

        rodadaAtual = null;
        desafioAtualId = null;

        votoRegistrado = false;
        desafioConcluido = false;
        pontuacaoRegistrada = false;

        pararVerificacaoDosVotos();

        bloquearBotoes();

        mostrarMensagem(
            '⏳ Aguardando o início da partida...'
        );

        return false;
    }

    if (!data.inicio_em || !data.fim_em) {

        console.error(
            'A partida está iniciada, mas os horários estão vazios.'
        );

        bloquearBotoes();

        mostrarMensagem(
            '⚠️ Erro nos horários da partida.'
        );

        return false;
    }

    inicioJogo = new Date(
        data.inicio_em
    );

    fimJogo = new Date(
        data.fim_em
    );


    console.log(
        'Início da partida:',
        inicioJogo.toLocaleString('pt-BR')
    );

    console.log(
        'Fim da partida:',
        fimJogo.toLocaleString('pt-BR')
    );


    return true;

}

function calcularRodadaAtual() {

    if (!inicioJogo || !fimJogo) {
        return null;
    }


    const agora = new Date();


    // Antes do início
    if (agora < inicioJogo) {
        return null;
    }


    // Depois do fim
    if (agora >= fimJogo) {
        return null;
    }


    const tempoDecorrido =
        agora.getTime() -
        inicioJogo.getTime();


    const minutosDecorridos =
        Math.floor(
            tempoDecorrido /
            (1000 * 60)
        );


    const rodada =
        Math.floor(
            minutosDecorridos / 20
        ) + 1;


    return Math.min(
        rodada,
        9
    );

}

function calcularInicioDaRodada() {

    if (!inicioJogo || !rodadaAtual) {
        return null;
    }


    return new Date(
        inicioJogo.getTime() +
        ((rodadaAtual - 1) * DURACAO_RODADA_MS)
    );

}

function calcularPontuacao(tempoGastoMs) {

    if (tempoGastoMs <= 0) {
        return PONTUACAO_MAXIMA;
    }


    const tempoRestante =
        DURACAO_RODADA_MS -
        tempoGastoMs;


    if (tempoRestante <= 0) {
        return 0;
    }


    const pontos =
        PONTUACAO_MAXIMA *
        (
            tempoRestante /
            DURACAO_RODADA_MS
        );


    return Math.max(
        0,
        Math.min(
            PONTUACAO_MAXIMA,
            Math.round(pontos)
        )
    );

}

async function registrarPontuacaoDaRodada(
    tempoConclusao
) {

    if (
        !jogadorAtual ||
        !rodadaAtual ||
        pontuacaoRegistrada
    ) {
        return;
    }


    const inicioRodada =
        calcularInicioDaRodada();


    if (!inicioRodada) {
        return;
    }


    const tempoGastoMs =
        tempoConclusao.getTime() -
        inicioRodada.getTime();


    const tempoGastoSegundos =
        Math.max(
            0,
            Math.floor(
                tempoGastoMs / 1000
            )
        );


    const pontos =
        calcularPontuacao(
            tempoGastoMs
        );


    console.log(
        '============================'
    );

    console.log(
        '💰 CALCULANDO PONTUAÇÃO'
    );

    console.log(
        'Equipe:',
        jogadorAtual.equipe_id
    );

    console.log(
        'Rodada:',
        rodadaAtual
    );

    console.log(
        'Tempo gasto:',
        tempoGastoSegundos,
        'segundos'
    );

    console.log(
        'Pontos:',
        pontos
    );

    console.log(
        '============================'
    );

    const {
        data,
        error
    } = await supabase.rpc(
        'registrar_pontuacao_rodada',
        {
            p_equipe_id:
                jogadorAtual.equipe_id,

            p_rodada:
                rodadaAtual,

            p_pontos:
                pontos,

            p_tempo_gasto:
                tempoGastoSegundos,

            p_concluido_em:
                tempoConclusao.toISOString()
        }
    );


    if (error) {

        console.error(
            '❌ Erro ao registrar pontuação:',
            error
        );

        return;
    }


    if (data === true) {

        pontuacaoRegistrada = true;

        console.log(
            `🏆 Pontuação registrada: +${pontos}`
        );


        if (valorPonto) {

            valorPonto.textContent =
                `+${pontos} moedas`;

        }

    } else {

        pontuacaoRegistrada = true;

        console.log(
            'ℹ️ Pontuação dessa rodada já havia sido registrada.'
        );

    }

}

async function carregarDesafio(rodada) {

    if (!jogadorAtual) {
        return;
    }


    const equipeId =
        jogadorAtual.equipe_id;


    console.log(
        `🔎 Buscando desafio da equipe ${equipeId}, rodada ${rodada}`
    );

    pararVerificacaoDosVotos();

    desafioConcluido = false;
    votoRegistrado = false;
    pontuacaoRegistrada = false;
    desafioAtualId = null;


    mostrarLoading();

    bloquearBotoes();

    const {
        data: ordem,
        error: ordemError
    } = await supabase
        .from('ordem_desafios')
        .select('desafio_id')
        .eq(
            'equipe_id',
            equipeId
        )
        .eq(
            'rodada',
            rodada
        )
        .maybeSingle();


    if (ordemError) {

        console.error(
            'Erro ao buscar ordem do desafio:',
            ordemError
        );

        mostrarMensagem(
            '⚠️ Erro ao carregar o desafio.'
        );

        return;
    }


    if (!ordem) {

        console.error(
            'Nenhuma ordem encontrada para esta rodada.'
        );

        mostrarMensagem(
            '⚠️ Nenhum desafio encontrado.'
        );

        return;
    }


    console.log(
        'Desafio encontrado na ordem:',
        ordem.desafio_id
    );
    const {
        data: desafio,
        error: desafioError
    } = await supabase
        .from('desafios')
        .select('id, texto')
        .eq(
            'id',
            ordem.desafio_id
        )
        .single();


    if (desafioError) {

        console.error(
            'Erro ao buscar desafio:',
            desafioError
        );

        mostrarMensagem(
            '⚠️ Erro ao carregar o desafio.'
        );

        return;
    }

    desafioAtualId =
        desafio.id;

    await new Promise(
        resolve =>
            setTimeout(
                resolve,
                1000
            )
    );

    mostrarDesafioNaTela(
        desafio
    );

    await verificarVotoDoJogador();

    iniciarVerificacaoDosVotos();

}

async function verificarVotoDoJogador() {

    if (
        !jogadorAtual ||
        !rodadaAtual ||
        !desafioAtualId
    ) {
        return;
    }


    const {
        data,
        error
    } = await supabase
        .from('votos')
        .select('id, concluido')
        .eq(
            'jogador_id',
            jogadorAtual.id
        )
        .eq(
            'equipe_id',
            jogadorAtual.equipe_id
        )
        .eq(
            'rodada',
            rodadaAtual
        )
        .eq(
            'desafio_id',
            desafioAtualId
        )
        .maybeSingle();


    if (error) {

        console.error(
            'Erro ao verificar voto:',
            error
        );

        return;
    }


    if (data) {

        votoRegistrado = true;

        bloquearBotoes();


        console.log(
            '🗳️ Jogador já votou:',
            data.concluido
                ? 'SIM'
                : 'NÃO'
        );


        await verificarConclusaoDoDesafio();

        return;
    }


    votoRegistrado = false;

    liberarBotoes();

}

async function registrarVoto(resposta) {

    if (!jogadorAtual) {
        return;
    }


    if (!rodadaAtual) {
        return;
    }


    if (!desafioAtualId) {
        return;
    }


    if (votoRegistrado) {
        return;
    }


    if (desafioConcluido) {
        return;
    }

    bloquearBotoes();


    console.log(
        '🗳️ Registrando voto:',
        resposta
            ? 'SIM'
            : 'NÃO'
    );

    const {
        error
    } = await supabase
        .from('votos')
        .insert([{

            jogador_id:
                jogadorAtual.id,

            equipe_id:
                jogadorAtual.equipe_id,

            desafio_id:
                desafioAtualId,

            rodada:
                rodadaAtual,

            concluido:
                resposta

        }]);

    if (error) {

        console.error(
            'Erro ao registrar voto:',
            error
        );


        // Voto duplicado
        if (error.code === '23505') {

            votoRegistrado = true;

            console.log(
                '⚠️ Esse jogador já votou nesta rodada.'
            );

            await verificarConclusaoDoDesafio();

            return;
        }


        alert(
            'Não foi possível registrar seu voto.'
        );


        liberarBotoes();

        return;
    }

    votoRegistrado = true;


    console.log(
        '✅ Voto salvo no Supabase.'
    );

    await verificarConclusaoDoDesafio();

}

async function contarJogadoresDaEquipe() {

    if (!jogadorAtual) {
        return 0;
    }


    const {
        data,
        error
    } = await supabase
        .from('jogadores')
        .select('id')
        .eq(
            'equipe_id',
            jogadorAtual.equipe_id
        );


    if (error) {

        console.error(
            'Erro ao contar jogadores da equipe:',
            error
        );

        return 0;
    }


    return data.length;

}

async function verificarConclusaoDoDesafio() {

    if (
        !jogadorAtual ||
        !rodadaAtual ||
        !desafioAtualId
    ) {
        return;
    }

    const totalJogadores =
        await contarJogadoresDaEquipe();


    if (totalJogadores === 0) {
        return;
    }

    const votosNecessarios =
        Math.ceil(
            totalJogadores / 2
        );

    const {
        data: votos,
        error
    } = await supabase
        .from('votos')
        .select('concluido')
        .eq(
            'equipe_id',
            jogadorAtual.equipe_id
        )
        .eq(
            'rodada',
            rodadaAtual
        )
        .eq(
            'desafio_id',
            desafioAtualId
        );


    if (error) {

        console.error(
            'Erro ao buscar votos:',
            error
        );

        return;
    }

    const votosSim =
        votos.filter(
            voto =>
                voto.concluido === true
        ).length;


    console.log(
        `🗳️ ${votosSim}/${totalJogadores} votos SIM`
    );


    console.log(
        `🎯 Necessários: ${votosNecessarios}`
    );

    if (
        votosSim >= votosNecessarios
    ) {

        // Evita várias execuções locais
        if (desafioConcluido) {
            return;
        }


        desafioConcluido = true;


        bloquearBotoes();


        pararVerificacaoDosVotos();


        const tempoConclusao =
            new Date();

        await registrarPontuacaoDaRodada(
            tempoConclusao
        );

        if (desafioTexto) {

            desafioTexto.textContent =
                '✅ DESAFIO CONCLUÍDO!';

        }


        console.log(
            '🎉 DESAFIO CONCLUÍDO!'
        );


    } else {

        if (valorPonto) {

            valorPonto.textContent =
                `${votosSim}/${totalJogadores} votos SIM`;

        }

    }

}

function iniciarVerificacaoDosVotos() {

    if (
        intervaloVerificacaoVotos !== null
    ) {
        return;
    }


    console.log(
        '🔄 Iniciando sincronização dos votos...'
    );


    intervaloVerificacaoVotos =
        setInterval(
            async () => {

                if (desafioConcluido) {

                    pararVerificacaoDosVotos();

                    return;
                }


                await verificarConclusaoDoDesafio();

            },
            2000
        );

}

function pararVerificacaoDosVotos() {

    if (
        intervaloVerificacaoVotos !== null
    ) {

        clearInterval(
            intervaloVerificacaoVotos
        );

        intervaloVerificacaoVotos = null;


        console.log(
            '⏹️ Sincronização dos votos encerrada.'
        );

    }

}

async function verificarRodada() {

    if (
        !inicioJogo ||
        !fimJogo
    ) {
        return;
    }


    const novaRodada =
        calcularRodadaAtual();

if (novaRodada === null) {

    console.log('🏁 PARTIDA ENCERRADA!');
    console.log('➡️ Indo para a tela final...');

    window.location.href = 'final.html';

    return;
}

    if (
        novaRodada !== rodadaAtual
    ) {

        rodadaAtual =
            novaRodada;


        console.log(
            '============================'
        );


        console.log(
            '🎯 NOVA RODADA:',
            rodadaAtual
        );


        await carregarDesafio(
            rodadaAtual
        );

    }

}

async function verificarEstadoDaPartida() {

    const partidaIniciada =
        await carregarPartida();


    if (!partidaIniciada) {
        return;
    }


    await verificarRodada();

    if (
        intervaloVerificacaoPartida !== null
    ) {

        clearInterval(
            intervaloVerificacaoPartida
        );

        intervaloVerificacaoPartida = null;

    }

    if (
        intervaloVerificacaoRodada === null
    ) {

        intervaloVerificacaoRodada =
            setInterval(
                verificarRodada,
                1000
            );

    }

}

function iniciarVerificacaoDaPartida() {

    verificarEstadoDaPartida();


    intervaloVerificacaoPartida =
        setInterval(
            async () => {

                if (!inicioJogo) {

                    await verificarEstadoDaPartida();

                }

            },
            5000
        );

}

if (botaoFeito) {

    botaoFeito.addEventListener(
        'click',
        () => {

            registrarVoto(true);

        }
    );

}

if (botaoRecusar) {

    botaoRecusar.addEventListener(
        'click',
        () => {

            registrarVoto(false);

        }
    );

}

async function iniciarJogo() {

    const jogadorCarregado =
        await carregarJogador();


    if (!jogadorCarregado) {
        return;
    }

    iniciarVerificacaoDaPartida();

}
iniciarJogo();