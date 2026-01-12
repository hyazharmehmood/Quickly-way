/**
 * Validation schemas and error messages
 */
export class ValidationError extends Error {
    constructor(field, message) {
        super(message);
        this.field = field;
        this.name = 'ValidationError';
    }
}

/**
 * User validation schema
 */
export const validateUser = (userData) => {
    const errors = [];

    if (!userData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)) {
        errors.push(new ValidationError('email', 'Valid email is required'));
    }

    if (!userData.name || userData.name.trim().length < 2) {
        errors.push(
            new ValidationError('name', 'Name must be at least 2 characters')
        );
    }

    if (!userData.role || !['client', 'freelancer'].includes(userData.role)) {
        errors.push(
            new ValidationError('role', 'Role must be either client or freelancer')
        );
    }

    return errors;
};

/**
 * Project validation schema
 */
export const validateProject = (projectData) => {
    const errors = [];

    if (!projectData.title || projectData.title.trim().length < 3) {
        errors.push(
            new ValidationError('title', 'Title must be at least 3 characters')
        );
    }

    if (!projectData.description || projectData.description.trim().length < 10) {
        errors.push(
            new ValidationError(
                'description',
                'Description must be at least 10 characters'
            )
        );
    }

    if (
        !projectData.budget ||
        typeof projectData.budget !== 'number' ||
        projectData.budget <= 0
    ) {
        errors.push(new ValidationError('budget', 'Valid budget is required'));
    }

    return errors;
};

/**
 * Proposal validation schema
 */
export const validateProposal = (proposalData) => {
    const errors = [];

    if (!proposalData.projectId || proposalData.projectId.trim().length === 0) {
        errors.push(new ValidationError('projectId', 'Project ID is required'));
    }

    if (
        !proposalData.bidAmount ||
        typeof proposalData.bidAmount !== 'number' ||
        proposalData.bidAmount <= 0
    ) {
        errors.push(new ValidationError('bidAmount', 'Valid bid amount is required'));
    }

    if (
        !proposalData.coverLetter ||
        proposalData.coverLetter.trim().length < 10
    ) {
        errors.push(
            new ValidationError(
                'coverLetter',
                'Cover letter must be at least 10 characters'
            )
        );
    }

    return errors;
};
