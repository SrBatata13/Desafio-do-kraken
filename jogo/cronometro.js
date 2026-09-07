import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://okanxeevvhnmtxlnwlol.supabase.co';
const supabaseKey = 'sb_publishable_aa0b-bcFDprV_NCnKRjcUA_lcquntDY';
const supabase = createClient(supabaseUrl, supabaseKey);

const timer = document.getElementById('timer');

let inicioJogo = null;
let fimJogo = null;

let intervaloCronometro = null;
let intervaloVerificacao = null;

async function buscarStatusJogo() {

    const { data, error } = await supabase
        .from('jogo_status')
        .select('iniciado, inicio_em, fim_em')
        .eq('id', 1)
        .single();


    if (error) {

        console.error(
            'Erro ao buscar status da partida:',
            error
        );

        timer.textContent = '--:--:--';

        return;

    }

    if (!data.iniciado) {

        timer.textContent = '03:00:00';

        console.log('⏳ Aguardando o início da partida...');

        return;

    }

    if (!data.inicio_em || !data.fim_em) {

        console.error(
            'A partida está marcada como iniciada, mas os horários não existem.'
        );

        timer.textContent = '--:--:--';

        return;

    }

    inicioJogo = new Date(data.inicio_em);
    fimJogo = new Date(data.fim_em);


    console.log(
        '🏴‍☠️ Início da partida:',
        inicioJogo.toLocaleString('pt-BR')
    );

    console.log(
        '🏁 Fim da partida:',
        fimJogo.toLocaleString('pt-BR')
    );

    if (intervaloVerificacao !== null) {

        clearInterval(intervaloVerificacao);

        intervaloVerificacao = null;

    }

    iniciarCronometro();

}

function iniciarCronometro() {

    // Evita criar dois cronômetros
    if (intervaloCronometro !== null) {

        clearInterval(intervaloCronometro);

    }


    // Atualiza imediatamente
    atualizarCronometro();


    // Depois atualiza a cada segundo
    intervaloCronometro = setInterval(() => {

        atualizarCronometro();

    }, 1000);

}

function atualizarCronometro() {

    if (!fimJogo) {

        return;

    }


    const agora = new Date();

    const tempoRestante =
        fimJogo.getTime() - agora.getTime();

    if (tempoRestante <= 0) {

        timer.textContent = '00:00:00';

        clearInterval(intervaloCronometro);

        intervaloCronometro = null;

        console.log('🏁 PARTIDA ENCERRADA!');

        finalizarPartida();

        return;

    }

    const horas = Math.floor(
        tempoRestante / (1000 * 60 * 60)
    );

    const minutos = Math.floor(
        (tempoRestante % (1000 * 60 * 60))
        / (1000 * 60)
    );

    const segundos = Math.floor(
        (tempoRestante % (1000 * 60))
        / 1000
    );

    timer.textContent =
        `${horas.toString().padStart(2, '0')}:` +
        `${minutos.toString().padStart(2, '0')}:` +
        `${segundos.toString().padStart(2, '0')}`;

}

function finalizarPartida() {

    console.log('🏆 O tempo da partida chegou ao fim.');
}

function iniciarVerificacao() {

    buscarStatusJogo();

    intervaloVerificacao = setInterval(() => {

        if (intervaloCronometro === null) {

            buscarStatusJogo();

        }

    }, 5000);

}

iniciarVerificacao();