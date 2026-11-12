import { useEffect, useState } from 'react';

/**
 * Busca dados de um serviço (/services) e controla os estados de
 * carregando / erro / dados, para as telas mostrarem loading e erro.
 *
 * Uso:
 *   const { dados, carregando, erro, recarregar } = useDados(() => listarNegocios(slug), [slug]);
 */
export default function useDados(buscar, dependencias = [], valorInicial = null) {
    const [dados, setDados] = useState(valorInicial);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState(null);
    const [tentativa, setTentativa] = useState(0);

    useEffect(() => {
        let cancelado = false;

        buscar()
            .then((resposta) => {
                if (cancelado) return;
                setDados(resposta);
                setErro(null);
            })
            .catch((e) => {
                if (cancelado) return;
                setErro(e);
            })
            .finally(() => {
                if (!cancelado) setCarregando(false);
            });

        return () => { cancelado = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [...dependencias, tentativa]);

    const recarregar = () => {
        setCarregando(true);
        setErro(null);
        setTentativa((t) => t + 1);
    };

    return { dados, carregando, erro, recarregar };
}
