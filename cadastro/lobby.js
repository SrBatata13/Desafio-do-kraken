import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

function gerarUUID() {
    if (crypto.randomUUID) {
        return crypto.randomUUID();
    }

    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

document.addEventListener('DOMContentLoaded', async () => {

    // ==========================================
    // CONFIGURAÇÃO DO SUPABASE
    // ==========================================

    const supabaseUrl = 'https://okanxeevvhnmtxlnwlol.supabase.co';

    const supabaseKey = 'sb_publishable_aa0b-bcFDprV_NCnKRjcUA_lcquntDY';

    const supabase = createClient(supabaseUrl, supabaseKey);


    // ==========================================
    // ELEMENTOS DA PÁGINA
    // ==========================================

    const inputFile = document.getElementById('upload');
    const fotoPerfil = document.querySelector('.foto-perfil');
    const nomeInput = document.getElementById('nome');
    const botaoJogar = document.getElementById('btn-jogar');


    // ==========================================
    // VERIFICAR SE O JOGADOR JÁ ESTÁ CADASTRADO
    // ==========================================

    const playerId = localStorage.getItem('player_id');

    if (playerId) {

        console.log('Jogador já cadastrado:', playerId);

        // Verifica se esse jogador ainda existe no banco
        const { data: jogador, error } = await supabase
            .from('jogadores')
            .select('id')
            .eq('id', playerId)
            .maybeSingle();

        if (error) {
            console.error('Erro ao verificar jogador:', error);
            return;
        }

        // Se o jogador existe, vai direto para o jogo
        if (jogador) {
            window.location.href = '../jogo/map.html';
            return;
        }

        // Se não existe mais, remove o ID antigo
        localStorage.removeItem('player_id');
    }


    // ==========================================
    // MOSTRAR A FOTO ESCOLHIDA
    // ==========================================

    function atualizarFoto(event) {

        const file = event.target.files[0];

        if (!file) return;

        const reader = new FileReader();

        reader.onload = function (e) {
            fotoPerfil.src = e.target.result;
        };

        reader.readAsDataURL(file);
    }


    // ==========================================
    // VERIFICAR NOME + FOTO
    // ==========================================

    function verificarCampos() {

        const nomePreenchido = nomeInput.value.trim() !== '';
        const fotoSelecionada = inputFile.files.length > 0;

        if (nomePreenchido && fotoSelecionada) {

            botaoJogar.disabled = false;

        } else {

            botaoJogar.disabled = true;

        }
    }


    // ==========================================
    // SELEÇÃO DA FOTO
    // ==========================================

    inputFile.addEventListener('click', function () {

        // Permite escolher novamente a mesma foto
        this.value = null;

    });


    inputFile.addEventListener('change', function (event) {

        atualizarFoto(event);
        verificarCampos();

    });


    // ==========================================
    // DIGITAÇÃO DO NOME
    // ==========================================

    nomeInput.addEventListener('input', verificarCampos);


    // ==========================================
    // DESCOBRIR A EQUIPE COM MENOS JOGADORES
    // ==========================================

    async function encontrarEquipe() {

        // Busca todas as equipes
        const { data: equipes, error: equipesError } = await supabase
            .from('equipes')
            .select('id, nome')
            .order('id', { ascending: true });
        
        console.log('EQUIPES RECEBIDAS DO SUPABASE:', equipes);
        console.log('ERRO AO BUSCAR EQUIPES:', equipesError);

        if (equipesError) {

            console.error('Erro ao buscar equipes:', equipesError);

            throw new Error('Não foi possível buscar as equipes.');

        }


        // Busca todos os jogadores e seus respectivos times
        const { data: jogadores, error: jogadoresError } = await supabase
            .from('jogadores')
            .select('equipe_id');

        if (jogadoresError) {

            console.error('Erro ao buscar jogadores:', jogadoresError);

            throw new Error('Não foi possível verificar as equipes.');

        }


        // Conta quantos jogadores existem em cada equipe
        const quantidadePorEquipe = {};

        equipes.forEach(equipe => {

            quantidadePorEquipe[equipe.id] = 0;

        });


        jogadores.forEach(jogador => {

            if (quantidadePorEquipe[jogador.equipe_id] !== undefined) {

                quantidadePorEquipe[jogador.equipe_id]++;

            }

        });


        console.log('Quantidade de jogadores:', quantidadePorEquipe);


        // ==========================================
        // ENCONTRAR A EQUIPE COM MENOS JOGADORES
        // ==========================================

        let equipeEscolhida = equipes[0];

        equipes.forEach(equipe => {

            const quantidadeAtual =
                quantidadePorEquipe[equipe.id];

            const quantidadeEscolhida =
                quantidadePorEquipe[equipeEscolhida.id];


            // Se tiver menos jogadores, troca a equipe
            if (quantidadeAtual < quantidadeEscolhida) {

                equipeEscolhida = equipe;

            }

            // Em caso de empate, NÃO fazemos nada.
            // Como as equipes estão ordenadas pelo ID,
            // a primeira continua sendo escolhida.

        });


        console.log(
            'Equipe escolhida:',
            equipeEscolhida.nome,
            'ID:',
            equipeEscolhida.id
        );


        return equipeEscolhida;

    }


    // ==========================================
    // BOTÃO JOGAR
    // ==========================================

    botaoJogar.addEventListener('click', async function (event) {

        event.preventDefault();


        // Verificação final
        if (
            nomeInput.value.trim() === '' ||
            inputFile.files.length === 0
        ) {

            alert('Por favor, coloque seu nome e escolha uma foto.');

            return;

        }


        // Desabilita o botão para impedir
        // dois cadastros acidentais
        botaoJogar.disabled = true;

        botaoJogar.textContent = 'ENTRANDO...';


        try {

            // ==========================================
            // 1. PEGAR FOTO E NOME
            // ==========================================

            const file = inputFile.files[0];

            const nome = nomeInput.value.trim();


            // ==========================================
            // 2. DESCOBRIR A EQUIPE
            // ==========================================

            const equipe = await encontrarEquipe();


            // ==========================================
            // 3. ENVIAR FOTO PARA O STORAGE
            // ==========================================

            const nomeArquivo = 
    `${Date.now()}-${gerarUUID()}-${file.name}`;


            const { data: uploadData, error: uploadError } =
                await supabase
                    .storage
                    .from('fotos')
                    .upload(nomeArquivo, file);


            if (uploadError) {

                console.error(
                    'Erro ao enviar imagem:',
                    uploadError
                );

                throw new Error(
                    'Não foi possível enviar sua foto.'
                );

            }


            // ==========================================
            // 4. PEGAR URL PÚBLICA DA FOTO
            // ==========================================

            const { data: publicUrlData } =
                supabase
                    .storage
                    .from('fotos')
                    .getPublicUrl(nomeArquivo);


            const fotoURL =
                publicUrlData.publicUrl;


            // ==========================================
            // 5. CRIAR JOGADOR NO BANCO
            // ==========================================

            const { data: jogadorCriado, error: jogadorError } =
                await supabase
                    .from('jogadores')
                    .insert([{

                        nome: nome,

                        foto_url: fotoURL,

                        equipe_id: equipe.id

                    }])
                    .select()
                    .single();


            if (jogadorError || !jogadorCriado) {

                console.error(
                    'Erro ao salvar jogador:',
                    jogadorError
                );

                // Se o jogador não foi criado,
                // tentamos apagar a foto que acabou
                // de ser enviada.
                await supabase
                    .storage
                    .from('fotos')
                    .remove([nomeArquivo]);


                throw new Error(
                    'Não foi possível salvar seus dados.'
                );

            }


            // ==========================================
            // 6. SALVAR ID DO JOGADOR
            // ==========================================

            localStorage.setItem(
                'player_id',
                jogadorCriado.id
            );


            // Também podemos guardar a equipe localmente
            // para facilitar algumas partes do jogo futuramente.
            localStorage.setItem(
                'equipe_id',
                equipe.id
            );


            // ==========================================
            // 7. MOSTRAR NO CONSOLE
            // ==========================================

            console.log('============================');
            console.log('JOGADOR CADASTRADO!');
            console.log('Nome:', jogadorCriado.nome);
            console.log('ID:', jogadorCriado.id);
            console.log('Equipe:', equipe.nome);
            console.log('Equipe ID:', equipe.id);
            console.log('Foto:', fotoURL);
            console.log('============================');


            // ==========================================
            // 8. IR PARA O JOGO
            // ==========================================

            window.location.href = '../jogo/map.html';


        } catch (error) {

            console.error(
                'Erro durante o cadastro:',
                error
            );

            alert(error.message);


            // Libera o botão novamente
            botaoJogar.disabled = false;

            botaoJogar.textContent = 'JOGAR';

        }

    });

});