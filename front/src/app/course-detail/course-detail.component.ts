import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from "@angular/router";
import { Course } from "../home/home.component";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { ApiHelperService } from '../services/api-helper.service';
import { getID, isLoggedIn } from '../services/storage.service';
import { gradeMap } from '../constants/constants';

@Component({
  selector: 'app-course-detail',
  templateUrl: './course-detail.component.html',
  styleUrls: ['./course-detail.component.scss']
})
export class CourseDetailComponent implements OnInit {

  private readonly route: ActivatedRoute;

  private readonly router: Router;

  private readonly apiService: ApiHelperService;

  public course: Course;

  public comments: Comment[] = [];

  public courses_url: string = "";

  public commentForm: FormGroup = new FormGroup(
    {
      comment: new FormControl('', Validators.required),
    }
  )

  public courseLoaded: boolean = false;

  public commentsLoaded: boolean = false;

  public isConnected: boolean = isLoggedIn();

  constructor(
    route: ActivatedRoute,
    router: Router,
    api: ApiHelperService
  ) {
    this.router = router;
    this.route = route;
    this.apiService = api;
    this.course = { title: "", id: 0, description: "", ECTSpoints: 0, ECTScard: "", semester: "", grade: "", faculties: "" };
  }

  async sendComment(): Promise<void> {
    let formValue = this.commentForm.value;

    const userID: number = getID();

    // user not connected
    if (userID < 0 || !this.isConnected) {
      return;
    }

    const courseID = this.route.snapshot.paramMap.get("id");

    const payload = {
      courseId: courseID,
      userId: userID,
      text: formValue.comment,
      date: new Date(Date.now())
    }

    console.log(payload)

    // posting comment
    try {
      await this.apiService.post({ endpoint: "/comments", data: payload });
    } catch (e) {
      console.error("Error when posting comment :", e)
    }

    // getting comments
    try {
      const coms = await this.apiService.get({ endpoint: "/courses/" + courseID + "/comments" });

      this.comments = [];
      for (let com of coms) {
        this.comments.push({ name: com.username, content: com.text });
      }

      this.comments = this.comments.reverse();
    } catch (e) {
      console.error("Error when getting comments :", e)
    }
  }

  async ngOnInit(): Promise<void> {
    let id: string | null = this.route.snapshot.paramMap.get("id");
    if (id == null) return;

    let co;
    try {
      co = await this.apiService.get({ endpoint: "/courses/" + id });
    } catch (e) {
      console.error("Error when getting course :", e);
    }


    this.course = {
      id: co.id,
      title: co.name,
      description: co.description,
      ECTSpoints: co.ECTS,
      ECTScard: co.ECTScard,
      semester: co.semester,
      grade: gradeMap[Math.round(co.rating) as keyof typeof gradeMap],
      faculties: co.faculties
    };

    this.courseLoaded = true;

    let coms;
    try {
      coms = await this.apiService.get({ endpoint: "/courses/" + id + "/comments" });
    } catch (e) {
      console.error("Error when getting coms :", e);
    }

    for (let com of coms) {
      this.comments.push({ name: com.username, content: com.text });
    }
    this.comments = this.comments.reverse();

    this.commentsLoaded = true;

    const urlArray = this.route.snapshot.url.map(s => s.path);
    if (urlArray.length >= 2) {
      this.courses_url = "/" + urlArray[0] + "/" + urlArray[1];
    }
  }
}

class Comment {
  public name: string;

  public content: string;

  constructor(
    name: string,
    content: string,
  ) {
    this.name = name;
    this.content = content;
  }
}
