import oracledb from 'oracledb';
import queryBindToString from 'bind-sql-string';
import Logger from './logger';
oracledb.fetchAsString = [ oracledb.CLOB ];
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

const logger = new Logger('info');

interface IOracleDb {
    runQueryOnDB: (
        query: string,
        binds: Object
    ) => Promise<string[][]>;
}

interface IOracleConfig {
    user: string | undefined,
    password: string | undefined,
    connectionString: string | undefined,
    poolAlias: 'default'
} 

export class OracleDb implements IOracleDb {
    private host: string | undefined;
    private username: string | undefined;
    private password: string | undefined;
    private connection: oracledb.Connection | null;


    constructor() {
        this.host = process.env.DB_URI;
        this.username = process.env.DB_USER;
        this.password = process.env.DB_PWD;
        this.connection = null;
    }

    private createPool = async () => {
        try {
            const dbConfig: IOracleConfig = {
                user: this.username,
                password: this.password,
                connectionString: this.host,
                poolAlias: 'default'
            };

            await oracledb.createPool(dbConfig);
        } catch (error) {
            console.error(`Erro ao estabelecer conexao com o Oracle. Erro: ${(error as Error).message}`);
            throw new Error((error as Error).message);
        }
    }

    private hasActiveConnection = async () => {
        try {
            const conn = await oracledb.getConnection();
            if(Object.values(conn).length > 0){
                return true;
            }
            throw new Error('Nao ha conexoes ativas...')
        } catch (error) {
            logger.error('Erro ao validar conexoes ativas: ', (error as Error).message);
            return false;
        }
    }

    private connectOnDb = async () => {
        try {
            if(await this.hasActiveConnection() === false){
                logger.info('Não ha pool de conexão ativos...iniciando nova conexao!');
                await this.createPool();
            }
            const connection = await oracledb.getConnection();
            this.connection = connection;
            return connection;
        } catch (error) {
            logger.error(`Erro ao estabelecer conexao com o Oracle: ${error}`);
        }
    }

    private closeConnection = async () => {
        try {
            if(await this.hasActiveConnection() === false){
                logger.warn('❓ Nao ha pools abertos...');
            }
            const Pool = oracledb.getPool();
            Pool.close(0,(error)=>{
                if(error !== null){
                    throw new Error((error as Error).message);
                }
            });
            return true;
        } catch (error) {
            logger.error('Erro ao encerrar Pool, motivo: ', (error as Error).message);
            return false;
        }
    }
    public runQueryOnDB = async (query: string, binds: {}) => {
        try {
            await this.connectOnDb();
            const queryBinds = queryBindToString(query, binds);
            if(queryBinds === undefined){
                throw new Error('Erro ao montar query...')
            }
            const { rows } = await this.connection!.execute<string[]>(queryBinds);
            if(rows === undefined || rows.length < 1){
                throw new Error('Nenhum dado encontrado para os filtros fornecidos.')
            }
            return rows;
        } catch (error) {
            logger.error(`Erro ao executar consulta: ${error}`);
            return [];
        }finally {
            this.closeConnection();
        }
    } 
}