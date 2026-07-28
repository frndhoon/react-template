type LogLevel = 'info' | 'error' | 'warn' | 'debug';

interface LogStyle {
	color: string;
	badge: string;
}

const LOG_STYLES: Record<LogLevel, LogStyle> = {
	info: { color: '#2196F3', badge: 'ℹ️' },
	error: { color: '#FF5252', badge: '❌' },
	warn: { color: '#FFC107', badge: '⚠️' },
	debug: { color: '#4CAF50', badge: '🔧' },
};

export class Logger {
	private static formatTime(): string {
		const now = new Date();
		const koreanTime = new Date(now.getTime() + 9 * 60 * 60 * 1000); // UTC+9
		return koreanTime.toISOString().split('T')[1].split('.')[0];
	}

	private static createMessage(level: LogLevel, context: string, message: string): string {
		const { badge } = LOG_STYLES[level];
		const time = this.formatTime();
		return `${badge} [${time}] [${context}] ${message}`;
	}

	private static log(level: LogLevel, context: string, message: string, data?: unknown): void {
		const { color } = LOG_STYLES[level];
		const formattedMessage = this.createMessage(level, context, message);

		const styles = [`color: ${color}`, 'font-weight: bold', 'padding: 2px 4px', 'border-radius: 2px'].join(';');

		if (data) {
			console.groupCollapsed(`%c${formattedMessage}`, styles);
			console.log('Details:', data);
			console.groupEnd();
		} else {
			console.log(`%c${formattedMessage}`, styles);
		}
	}

	static error(context: string, message: string, data?: unknown): void {
		this.log('error', context, message, data);
	}

	static warn(context: string, message: string, data?: unknown): void {
		this.log('warn', context, message, data);
	}

	static info(context: string, message: string, data?: unknown): void {
		this.log('info', context, message, data);
	}

	static debug(context: string, message: string, data?: unknown): void {
		this.log('debug', context, message, data);
	}
}
