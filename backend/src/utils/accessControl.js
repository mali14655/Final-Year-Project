import Project from "../models/Project.js";
import Interview from "../models/Interview.js";

export async function findProjectForUser(projectId, userId) {
  if (!projectId || !userId) {
    return null;
  }
  return Project.findOne({ _id: projectId, userId });
}

export async function getInterviewAccess(interviewId, userId) {
  const interview = await Interview.findById(interviewId);
  if (!interview) {
    return { allowed: false, interview: null };
  }

  if (interview.userId && interview.userId.toString() === userId.toString()) {
    return { allowed: true, interview };
  }

  if (interview.projectId) {
    const project = await findProjectForUser(interview.projectId, userId);
    if (project) {
      return { allowed: true, interview };
    }
  }

  return { allowed: false, interview };
}
