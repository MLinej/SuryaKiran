const errorHandler = (err, req, res, next) => {
    console.error(err.stack);

    if (err.name === 'ZodError') {
        const firstIssue = err.issues[0];
        return res.status(400).json({
            error: 'Validation failed',
            details: firstIssue.message
        });
    }

    res.status(500).json({
        error: 'Internal Server Error',
        details: err.message || 'Something went wrong on the server.',
    });
};

module.exports = errorHandler;
