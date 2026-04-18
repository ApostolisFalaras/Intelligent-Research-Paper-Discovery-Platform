import ProjectsList from "./../profile/ProjectsList.jsx";

function ProjectsPage() {
    return (
        <section className="projects-page">
            <header className="projects-page-header">
                <h1>Projects</h1>
                <p>Browse your saved projects and their papers.</p>
            </header>

            <ProjectsList projects={[]} />
        </section>
    );
}

export default ProjectsPage;