import styles from './TheoryPanel.module.css';

// Helper for displaying theory features

const TheoryPanel = ({ tissue }) => {
    if (!tissue) {
        return (
            <div className={styles.panel}>
                <div className={styles.emptyState}>
                    Select a tissue to view theory
                </div>
            </div>
        );
    }

    const { theory } = tissue;

    return (
        <div className={styles.panel}>
            <div className={styles.content}>
                <header className={styles.header}>
                    <div className={styles.category}>{tissue.category}</div>
                    <h2 className={styles.title}>{tissue.name}</h2>
                    <p className={styles.description}>{tissue.description}</p>
                </header>

                {theory && (
                    <>
                        {/* Key Features */}
                        {theory.features && theory.features.length > 0 && (
                            <section className={styles.section}>
                                <h3>Key Features</h3>
                                <ul className={styles.featureList}>
                                    {theory.features.map((feature, idx) => (
                                        <li key={idx}>{feature}</li>
                                    ))}
                                </ul>
                            </section>
                        )}

                        {/* Function & Location Grid */}
                        <div className={styles.gridSection}>
                            {theory.location && theory.location.length > 0 && (
                                <section>
                                    <h3>Location</h3>
                                    <ul>
                                        {theory.location.map((loc, idx) => (
                                            <li key={idx}>{loc}</li>
                                        ))}
                                    </ul>
                                </section>
                            )}

                            {theory.function && theory.function.length > 0 && (
                                <section>
                                    <h3>Function</h3>
                                    <ul>
                                        {theory.function.map((func, idx) => (
                                            <li key={idx}>{func}</li>
                                        ))}
                                    </ul>
                                </section>
                            )}
                        </div>

                        {/* Exam Tips */}
                        {theory.examTips && (
                            <section className={`${styles.section} ${styles.examTipBoard}`}>
                                <div className={styles.examTipHeader}>
                                    <div className={styles.tipIcon}>💡</div>
                                    <h3>Exam Tips</h3>
                                </div>
                                <p>{theory.examTips}</p>
                            </section>
                        )}
                    </>
                )}
            </div>

        </div>
    );
};

export default TheoryPanel;
