// LOW PRIORITY FIX: Dependency Injection Pattern Example
// This demonstrates how to use DI for better testability and maintainability

/**
 * Service Container for Dependency Injection
 * Allows services to be injected rather than directly imported
 */
class ServiceContainer {
    constructor() {
        this.services = new Map();
        this.singletons = new Map();
    }

    /**
     * Register a service factory
     * @param {string} name - Service name
     * @param {Function} factory - Factory function that creates the service
     * @param {boolean} singleton - Whether to cache the instance
     */
    register(name, factory, singleton = true) {
        this.services.set(name, { factory, singleton });
    }

    /**
     * Get a service instance
     * @param {string} name - Service name
     * @returns {*} Service instance
     */
    get(name) {
        const service = this.services.get(name);
        if (!service) {
            throw new Error(`Service ${name} not registered`);
        }

        if (service.singleton) {
            if (!this.singletons.has(name)) {
                this.singletons.set(name, service.factory(this));
            }
            return this.singletons.get(name);
        }

        return service.factory(this);
    }

    /**
     * Check if a service is registered
     * @param {string} name - Service name
     * @returns {boolean}
     */
    has(name) {
        return this.services.has(name);
    }

    /**
     * Clear all services (useful for testing)
     */
    clear() {
        this.services.clear();
        this.singletons.clear();
    }
}

// Create global container instance
const container = new ServiceContainer();

// Example: Register database service
container.register('database', (container) => {
    return require('../config/database.js').pool;
}, true);

// Example: Register logger service
container.register('logger', (container) => {
    return require('./logger.js').default;
}, true);

// Example: Register email service
container.register('emailService', (container) => {
    const EmailService = require('../services/emailService.js').default;
    return new EmailService();
}, true);

/**
 * Decorator for dependency injection (if using decorators)
 * @param {string[]} dependencies - Array of dependency names
 */
export function inject(dependencies) {
    return function(target) {
        target.dependencies = dependencies;
        return target;
    };
}

/**
 * Example service using dependency injection
 */
export class ExampleService {
    constructor(database, logger) {
        this.database = database;
        this.logger = logger;
    }

    async getData() {
        this.logger.info('Fetching data');
        const [rows] = await this.database.query('SELECT * FROM users LIMIT 10');
        return rows;
    }
}

// Register example service
container.register('exampleService', (container) => {
    return new ExampleService(
        container.get('database'),
        container.get('logger')
    );
}, true);

export default container;

