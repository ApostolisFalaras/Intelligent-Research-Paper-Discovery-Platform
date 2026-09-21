import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import CitationsChart from "../../../src/components/authors/CitationsChart.jsx";


// Mocking elements of the 'recharts' package
vi.mock("recharts", () => ({
	ResponsiveContainer: ({ children }) => (
		<div data-testid="responsive-container">
			{children}
		</div>
	),

	ComposedChart: ({ data, children }) => (
		<div
			data-testid="composed-chart"
			data-years={data.map((entry) => entry.year).join(",")}
		>
			{children}
		</div>
	),

	CartesianGrid: () => (
		<div data-testid="cartesian-grid" />
	),

	XAxis: ({ dataKey }) => (
		<div data-testid="x-axis" data-key={dataKey} />
	),

	YAxis: ({ yAxisId }) => (
		<div data-testid={`y-axis-${yAxisId}`} />
	),

	Tooltip: () => (
		<div data-testid="tooltip" />
	),

	Legend: () => (
		<div data-testid="legend" />
	),

	Bar: ({ dataKey, name }) => (
		<div
			data-testid={`bar-${dataKey}`}
			data-name={name}
		/>
	),

	Line: ({ dataKey, name }) => (
		<div
			data-testid={`line-${dataKey}`}
			data-name={name}
		/>
	)
}));


const mockCitationData = [
	{
		year: 2024,
		worksCount: 10,
		oaWorksCount: 8,
		citedByCount: 250
	},
	{
		year: 2020,
		worksCount: 4,
		oaWorksCount: 2,
		citedByCount: 50
	},
	{
		year: 2022,
		worksCount: 7,
		oaWorksCount: 5,
		citedByCount: 120
	}
];


describe("CitationsChart", () => {

	// ---------- RENDERING TESTS ----------

	it("Displays the chart heading", () => {
		render(<CitationsChart data={mockCitationData} />);

		expect(screen.getByText("Output & Citations by Year")).toBeInTheDocument();
	});


	it("Sorts citation data chronologically before passing it to the chart", () => {
		render(<CitationsChart data={mockCitationData} />);

		expect(screen.getByTestId("composed-chart")).toHaveAttribute("data-years","2020,2022,2024");
	});


	it("Does not mutate the original citation data", () => {
		const data = [...mockCitationData];

		render(<CitationsChart data={data} />);

		expect(data.map((entry) => entry.year)).toEqual([2024, 2020, 2022]);
	});


	it("Configures the publications bar", () => {
		render(<CitationsChart data={mockCitationData} />);

		expect(screen.getByTestId("bar-worksCount")).toHaveAttribute("data-name","Publications");
	});


	it("Configures the open access bar", () => {
		render(<CitationsChart data={mockCitationData} />);

		expect(screen.getByTestId("bar-oaWorksCount")).toHaveAttribute("data-name","Open Access");
	});


	it("Configures the citations line", () => {
		render(<CitationsChart data={mockCitationData} />);

		expect(screen.getByTestId("line-citedByCount")).toHaveAttribute("data-name","Citations");
	});


	it("Handles an empty data array", () => {
		render(<CitationsChart data={[]} />);

		expect(screen.getByTestId("composed-chart")).toHaveAttribute("data-years", "");
		expect(screen.getByText("Output & Citations by Year")).toBeInTheDocument();
	});
});