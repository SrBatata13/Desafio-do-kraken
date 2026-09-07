import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// ===============================
// CONFIGURAÇÃO DO SUPABASE
// ===============================

 const supabaseUrl = 'https://okanxeevvhnmtxlnwlol.supabase.co';
const supabaseKey = 'sb_publishable_aa0b-bcFDprV_NCnKRjcUA_lcquntDY';
const supabase = createClient(supabaseUrl, supabaseKey);

// ==========================================
// ELEMENTOS DA PÁGINA
// ==========================================

const status = document.getElementById('status');
const botaoIniciar = document.getElementById('iniciar');
const botaoResetar = document.getElementById('resetar');


// ==========================================
// VERIFICAR SITUAÇÃO DO JOGO
// ==========================================

async function verificarSituacao() {

    const { data, error } = await supabase
        .from('jogo_status')
        .select('iniciado, inicio_em, fim_em')
        .eq('id', 1)
        .single();

    if (error) {

        console.error('Erro ao consultar jogo:', error);

        status.textContent = 'ERRO AO CONSULTAR JOGO';

        return;
    }


    // ==========================================
    // JOGO NÃO COMEÇOU
    // ==========================================

    if (!data.iniciado) {

        status.textContent = '🏴‍☠️ JOGO NÃO INICIADO';

        botaoIniciar.disabled = false;

        return;
    }


    // ==========================================
    // VERIFICAR HORÁRIO DE TÉRMINO
    // ==========================================

    if (!data.fim_em) {

        console.error(
            'Partida iniciada sem horário de término.'
        );

        status.textContent =
            '❌ ERRO NO HORÁRIO DA PARTIDA';

        botaoIniciar.disabled = true;

        return;
    }


    const agora = new Date();
    const fim = new Date(data.fim_em);


    // ==========================================
    // JOGO JÁ TERMINOU
    // ==========================================

    if (agora >= fim) {

        status.textContent =
            '🏁 JOGO ENCERRADO';

        botaoIniciar.disabled = true;

        return;
    }


    // ==========================================
    // JOGO EM ANDAMENTO
    // ==========================================

    const inicio = new Date(data.inicio_em);

    status.textContent =
        `🏴‍☠️ JOGO EM ANDAMENTO\n` +
        `Início: ${inicio.toLocaleTimeString('pt-BR')}\n` +
        `Fim: ${fim.toLocaleTimeString('pt-BR')}`;

    botaoIniciar.disabled = true;
}


// ==========================================
// INICIAR PARTIDA
// ==========================================

async function iniciarCronometro() {

    botaoIniciar.disabled = true;

    const agora = new Date();

    // Partida = 3 horas

    const fim = new Date(
        agora.getTime() +
        (3 * 60 * 60 * 1000)
    );


    console.log(
        '🟡 Tentando iniciar a partida...'
    );

    console.log(
        'Início:',
        agora.toISOString()
    );

    console.log(
        'Fim:',
        fim.toISOString()
    );


    const {
        data,
        error
    } = await supabase

        .from('jogo_status')

        .update({
            iniciado: true,
            inicio_em: agora.toISOString(),
            fim_em: fim.toISOString()
        })

        .eq('id', 1)

        .select();


    // ==========================================
    // ERRO
    // ==========================================

    if (error) {

        console.error(
            '❌ Erro ao iniciar jogo:',
            error
        );

        status.textContent =
            '❌ ERRO AO INICIAR JOGO';

        botaoIniciar.disabled = false;

        return;
    }


    console.log(
        '✅ Partida iniciada:',
        data
    );


    status.textContent =
        `🏴‍☠️ JOGO INICIADO!\n` +
        `Início: ${agora.toLocaleTimeString('pt-BR')}\n` +
        `Fim: ${fim.toLocaleTimeString('pt-BR')}`;
}


// ==========================================
// APAGAR TODAS AS FOTOS DA GALERIA
// ==========================================

async function apagarTodasAsFotos() {

    console.log(
        '📸 Buscando arquivos da galeria...'
    );


    // ==========================================
    // LISTAR ARQUIVOS
    // ==========================================

    const {
        data: arquivos,
        error: listarError
    } = await supabase
        .storage
        .from('fotos')
        .list('', {
            limit: 1000
        });


    if (listarError) {

        throw new Error(
            `Erro ao listar fotos: ${listarError.message}`
        );
    }


    // ==========================================
    // GALERIA JÁ ESTÁ VAZIA
    // ==========================================

    if (!arquivos || arquivos.length === 0) {

        console.log(
            '📸 A galeria já está vazia.'
        );

        return;
    }


    // ==========================================
    // PEGAR NOMES DOS ARQUIVOS
    // ==========================================

    const caminhos = arquivos

        .filter(arquivo => arquivo.name)

        .map(arquivo => arquivo.name);


    if (caminhos.length === 0) {

        console.log(
            '📸 Nenhum arquivo encontrado.'
        );

        return;
    }


    console.log(
        '📸 Arquivos encontrados:',
        caminhos
    );


    // ==========================================
    // APAGAR TODOS OS ARQUIVOS
    // ==========================================

    const {
        data,
        error: apagarError
    } = await supabase

        .storage

        .from('fotos')

        .remove(caminhos);


    if (apagarError) {

        throw new Error(
            `Erro ao apagar fotos: ${apagarError.message}`
        );
    }


    console.log(
        '✅ Fotos apagadas:',
        data
    );
}


// ==========================================
// RESETAR PARTIDA
// ==========================================

async function resetarTudo() {

    const confirmar = confirm(

        '⚠️ ATENÇÃO!\n\n' +

        'Isso irá apagar TODOS os dados da partida:\n\n' +

        '• Jogadores\n' +
        '• Fotos da galeria\n' +
        '• Votos\n' +
        '• Pontuações das rodadas\n' +
        '• Moedas das equipes\n\n' +

        'A ordem dos desafios será mantida.\n\n' +

        'Deseja realmente resetar o jogo?'

    );


    if (!confirmar) {
        return;
    }


    console.log(
        '=========================================='
    );

    console.log(
        '🟡 INICIANDO RESET COMPLETO'
    );

    console.log(
        '=========================================='
    );


    // Evita vários cliques

    botaoResetar.disabled = true;
    botaoIniciar.disabled = true;


    try {

        // ==========================================
        // 1. APAGAR FOTOS
        // ==========================================

        console.log(
            '1️⃣ Apagando fotos...'
        );

        await apagarTodasAsFotos();


        // ==========================================
        // 2. APAGAR VOTOS
        // ==========================================

        console.log(
            '2️⃣ Apagando votos...'
        );


        const {
            error: votosError
        } = await supabase

            .from('votos')

            .delete()

            .neq('id', 0);


        if (votosError) {

            throw new Error(
                `Erro ao apagar votos: ${votosError.message}`
            );
        }


        console.log(
            '✅ Votos apagados.'
        );


// ==========================================
// 3. APAGAR PONTUAÇÕES DAS RODADAS
// ==========================================

console.log(
    '3️⃣ Apagando pontuações das rodadas...'
);

const {
    error: pontuacoesError
} = await supabase
    .rpc('resetar_pontuacoes_rodadas');

if (pontuacoesError) {

    throw new Error(
        `Erro ao apagar pontuações: ${pontuacoesError.message}`
    );
}

console.log(
    '✅ Pontuações das rodadas apagadas.'
);

        // ==========================================
        // 4. ZERAR EQUIPES
        // ==========================================

        console.log(
            '4️⃣ Zerando moedas das equipes...'
        );


        const {
            error: equipesError
        } = await supabase

            .from('equipes')

            .update({
                pontuacao: 0
            })

            .neq('id', 0);


        if (equipesError) {

            throw new Error(
                `Erro ao zerar equipes: ${equipesError.message}`
            );
        }


        console.log(
            '✅ Moedas das equipes zeradas.'
        );


        // ==========================================
        // 5. APAGAR JOGADORES
        // ==========================================

        console.log(
            '5️⃣ Apagando jogadores...'
        );


        const {
            error: jogadoresError
        } = await supabase

            .from('jogadores')

            .delete()

            .neq('id', 0);


        if (jogadoresError) {

            throw new Error(
                `Erro ao apagar jogadores: ${jogadoresError.message}`
            );
        }


        console.log(
            '✅ Jogadores apagados.'
        );


        // ==========================================
        // 6. RESETAR STATUS DO JOGO
        // ==========================================

        console.log(
            '6️⃣ Resetando status da partida...'
        );


        const {
            error: statusError
        } = await supabase

            .from('jogo_status')

            .update({

                iniciado: false,
                inicio_em: null,
                fim_em: null

            })

            .eq('id', 1);


        if (statusError) {

            throw new Error(
                `Erro ao resetar status: ${statusError.message}`
            );
        }


        console.log(
            '✅ Status da partida resetado.'
        );


        // ==========================================
        // 7. LIMPAR DADOS LOCAIS
        // ==========================================

        localStorage.clear();


        // ==========================================
        // RESET CONCLUÍDO
        // ==========================================

        status.textContent =
            '🔄 JOGO RESETADO COM SUCESSO!';


        botaoIniciar.disabled = false;
        botaoResetar.disabled = false;


        console.log(
            '=========================================='
        );

        console.log(
            '🏴‍☠️ RESET COMPLETO CONCLUÍDO!'
        );

        console.log(
            '=========================================='
        );


        alert(

            '🏴‍☠️ JOGO RESETADO COM SUCESSO!\n\n' +

            '✅ Jogadores apagados\n' +
            '✅ Fotos apagadas\n' +
            '✅ Votos apagados\n' +
            '✅ Pontuações apagadas\n' +
            '✅ Moedas zeradas\n\n' +

            '✅ Ordem dos desafios mantida.'

        );


    } catch (error) {

        console.error(
            '❌ ERRO DURANTE O RESET:',
            error
        );


        status.textContent =
            '❌ ERRO AO RESETAR';


        botaoIniciar.disabled = false;
        botaoResetar.disabled = false;


        alert(

            '❌ O reset não foi concluído.\n\n' +

            error.message +

            '\n\nVerifique o console para mais detalhes.'

        );

    }

}


// ==========================================
// DISPONIBILIZAR FUNÇÕES
// ==========================================
//
// Seu HTML usa:
//
// onclick="iniciarCronometro()"
// onclick="resetarTudo()"
//
// Por isso precisamos deixar as funções
// disponíveis globalmente.
//

window.iniciarCronometro =
    iniciarCronometro;

window.resetarTudo =
    resetarTudo;


// ==========================================
// INICIALIZAÇÃO
// ==========================================

verificarSituacao();