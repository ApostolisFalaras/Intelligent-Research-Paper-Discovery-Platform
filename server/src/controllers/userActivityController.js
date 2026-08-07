import { 
	recordPaperView,
	recordPaperSave,
	recordPaperUnsave
} from "./../services/recommendationEventService.js";

export async function recordPaperViewController(req, res, next) {
	try {
		await recordPaperView(req.user.id, req.params.id);

		return res.status(200).json({
			status: "success",
			message: `User ${req.user.id} view on paper ${req.params.id} recorded successfully`
		});
		
	} catch (error) {
		next(error);
	}
}

export async function recordPaperSaveController(req, res, next) {
	try {
		await recordPaperSave(req.user.id, req.params.id);

		return res.status(200).json({
			status: "success",
			message: `User ${req.user.id} save on paper ${req.params.id} recorded successfully`
		});

	} catch (error) {
		next(error);
	}
}

export async function recordPaperUnsaveController(req, res, next) {
	try {
		await recordPaperUnsave(req.user.id, req.params.id);

		return res.status(200).json({
			status: "success",
			message: `User ${req.user.id} unsave on paper ${req.params.id} recorded successfully`
		});

	} catch (error) {
		next(error);
	}
}