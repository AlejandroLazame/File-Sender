import { appendFileSync, existsSync, mkdirSync } from "fs";
import { join } from 'path';

type LogLevel = 'info' | 'warn' | 'error';

class Logger {
    private level: LogLevel;
    private logToFile: boolean;
    private logDir: string;
    private logFile: string;

    constructor(level: LogLevel = 'info', logToFile=true, logDir='logs') {
        this.level = level;
        this.logToFile = logToFile;
        this.logDir = logDir;
        this.logFile = join(logDir, 'application.log');

        if(this.logToFile) {
            this.ensureLogDirectory();
        }
    }

    private getLocaleTimestamp(locale: string = 'pt-BR'): string {
        const date = new Date();
        return new Intl.DateTimeFormat(locale, {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false
        }).format(date);
    }

    private log(level: LogLevel, message: string, ...optionalParams: any[]) {
        const timestamp = this.getLocaleTimestamp();
        const formattedMessage = `[${timestamp}] [${level.toUpperCase()}]: ${message}`;

        if ((level === 'info')) {
            console.info(formattedMessage, ...optionalParams);
        } else if (level === 'warn') {
            console.warn(formattedMessage, ...optionalParams);
        } else if (level === 'error') {
            console.error(formattedMessage, ...optionalParams);
        }

        if(this.logToFile){
            this.writeToFile(formattedMessage);
        }
    }

    private writeToFile(logMessage: string){
        try {
            appendFileSync(this.logFile, logMessage + '\n', {encoding: 'utf-8'});
        } catch (error) {
            console.error(`Erro ao gravar log no arquivo: ${error}`);
        }
    }

    private ensureLogDirectory() {
        if(!existsSync(this.logDir)) {
            mkdirSync(this.logDir, {recursive: true});
        }
    }

    info(message: string, ...optionalParams: any[]) {
        if(this.shouldLog('info')) {
            this.log('info', message, ...optionalParams);
        }
    }

    warn(message: string, ...optionalParams: any[]) {
        if(this.shouldLog('warn')) {
            this.log('warn', message, ...optionalParams);
        }
    }

    error(message: string, ...optionalParams: any[]) {
        if(this.shouldLog('error')) {
            this.log('error', message, ...optionalParams);
        }
    }

    private shouldLog(level: LogLevel): boolean {
        const levels: LogLevel[] = ['info', 'warn', 'error'];
        return levels.indexOf(level) >= levels.indexOf(this.level);
    }
}

export default Logger;